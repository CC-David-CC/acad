const {Parser,parseString}=require('browser-xml2js');
const timers=require('timers');
window.xmlTimerFixture={Parser,parseString,timers};
