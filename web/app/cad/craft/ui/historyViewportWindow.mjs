// Derived horizontal projection only. Full authored history stays with craft.
export const HISTORY_SLOT_WIDTH=34;
export const HISTORY_END_WIDTH=4;
export const HISTORY_OVERSCAN=4;
export function historyViewportWindow(count,left,width,futureAt=-1){
 if(!Number.isSafeInteger(count)||count<0||count>Number.MAX_SAFE_INTEGER/HISTORY_SLOT_WIDTH-2||!Number.isFinite(left)||!Number.isFinite(width)||width<0||!Number.isInteger(futureAt)||futureAt < -1||futureAt>count)throw Error('Invalid history viewport.');
 const position=index=>index*HISTORY_SLOT_WIDTH+(futureAt>=0&&futureAt<index?HISTORY_SLOT_WIDTH:0);
 const rowsWidth=position(count),totalWidth=rowsWidth+HISTORY_END_WIDTH+15+(futureAt===count?HISTORY_SLOT_WIDTH:0);
 const scrollLeft=Math.max(0,Math.min(left,Math.max(0,totalWidth-width)));
 // The optional insertion item shifts following positions by one slot. An
 // extra conservative slot on each side covers that shift without a scan.
 const start=Math.max(0,Math.min(count,Math.floor(scrollLeft/HISTORY_SLOT_WIDTH)-HISTORY_OVERSCAN-1));
 const end=Math.max(start,Math.min(count,Math.ceil((scrollLeft+Math.max(width,HISTORY_SLOT_WIDTH))/HISTORY_SLOT_WIDTH)+HISTORY_OVERSCAN+1));
 return Object.freeze({start,end,scrollLeft,leftWidth:position(start),rightWidth:rowsWidth-position(end),totalWidth});
}
export function historyPointerScrollLeft(count,pointer,width,futureAt=-1){
 if(!Number.isInteger(pointer)||pointer< -1||pointer>=count)throw Error('Invalid history pointer.');
 const index=pointer+1,position=index*HISTORY_SLOT_WIDTH+(futureAt>=0&&futureAt<index?HISTORY_SLOT_WIDTH:0);
 return historyViewportWindow(count,10+position+HISTORY_SLOT_WIDTH/2-width/2,width,futureAt).scrollLeft;
}
