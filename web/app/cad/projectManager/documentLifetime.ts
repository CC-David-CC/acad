// A content hash identifies bytes, not the lifetime of the document using them.
// Keep this primitive independent of the editor, renderer and geometry engines.
export class DocumentLifetime {
  private generationValue = 0;
  private controller = new AbortController();
  private disposed = false;

  get generation(): number { return this.generationValue; }
  get signal(): AbortSignal { return this.controller.signal; }

  isCurrent(generation: number): boolean {
    return !this.disposed && !this.controller.signal.aborted && generation === this.generationValue;
  }

  assertCurrent(generation: number): void {
    if (!this.isCurrent(generation)) throw new DOMException('Document was replaced or closed.', 'AbortError');
  }

  begin(): number {
    this.assertCurrent(this.generationValue);
    if (this.generationValue >= Number.MAX_SAFE_INTEGER) {
      this.dispose();
      throw new Error('Document generation is exhausted.');
    }
    const previous = this.controller;
    const generation = ++this.generationValue;
    this.controller = new AbortController();
    // Publish the new generation before synchronous abort listeners run.
    // A listener may start another replacement; callers must validate the
    // generation returned here rather than adopting whatever is current later.
    previous.abort();
    return generation;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.abort();
  }
}
