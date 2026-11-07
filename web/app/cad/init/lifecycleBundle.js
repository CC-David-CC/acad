import {state} from 'lstream';

export function activate(ctx) {
  const {streams, services} = ctx;
  const asyncInitializingJobs = new Set();
  let loadingProject = false;
  const startTime = performance.now();
  streams.lifecycle = {
    appReady: state(false),
    projectLoaded: state(false),
    initializationFailure: state(null)
  };
  services.lifecycle = {
    startAsyncInitializingJob : job => {
      if (!streams.lifecycle.projectLoaded.value) {
        asyncInitializingJobs.add(job);
      }
    },
    finishAsyncInitializingJob : job => {
      asyncInitializingJobs.delete(job);
      services.lifecycle.loadProjectRequest();
    },
    failAsyncInitializingJob: (job, error) => {
      if (streams.lifecycle.projectLoaded.value || streams.lifecycle.initializationFailure.value) return;
      let message = 'Initialization failed';
      try { message = String(error?.message || error || message).slice(0, 512); } catch (_) { /* retain a safe failure */ }
      streams.lifecycle.initializationFailure.next(Object.freeze({job: String(job).slice(0,128), message}));
    },
    pendingInitializingJobs: () => Object.freeze([...asyncInitializingJobs]),
    loadProjectRequest: () => {
      if (streams.lifecycle.appReady.value && 
        !streams.lifecycle.projectLoaded.value && 
        !streams.lifecycle.initializationFailure.value && !loadingProject &&
        services.extension.allExtensionsReady() &&
        asyncInitializingJobs.size === 0) {
        
        loadingProject = true;
        try {
          services.extension.activateAllExtensions();
          if (streams.lifecycle.initializationFailure.value) return;
          ctx.projectService.load();
          if (streams.lifecycle.initializationFailure.value) return;
          const onLoadTime = performance.now();
          console.log("project loaded, took: " + ((onLoadTime - startTime) / 1000).toFixed(2) + ' sec');
          streams.lifecycle.projectLoaded.value = true;
        } catch (error) {
          services.lifecycle.failAsyncInitializingJob('project:load', error);
        } finally { loadingProject = false; }
      }
    },
    declareAppReady: () => {
      streams.lifecycle.appReady.value = true;
      services.lifecycle.loadProjectRequest();
    }
  }
}

export const BundleName = "@Lifecycle";
