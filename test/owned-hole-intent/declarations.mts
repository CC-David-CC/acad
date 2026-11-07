import {captureOwnedHoleIntent,type OwnedHoleIntent,type CenteredThroughHoleIntent,type FourCornerThroughHoleIntent} from '../../modules/engine/solid/ownedHoleIntent.mjs';
const intent:OwnedHoleIntent=captureOwnedHoleIntent({});
const unit:'millimeter'=intent.unit;
const engine:'occ'=intent.engine;
if(intent.kind==='four-corner-through'){
 const four:FourCornerThroughHoleIntent=intent;
 const x:number=four.offsetX;
 const y:number=four.offsetY;
 void [x,y];
}else{
 const centered:CenteredThroughHoleIntent=intent;
 // @ts-expect-error centered intent has no numeric corner offset
 const x:number=centered.offsetX;
 void x;
}
// @ts-expect-error captured intent is immutable
intent.diameter=3;
// @ts-expect-error native handles are not authored data
intent.handle;
// @ts-expect-error through-all depth is derived at evaluation, not saved intent
intent.depth;
// @ts-expect-error supported hole kinds are literal discriminants
const kind:OwnedHoleIntent['kind']='centered';
void [unit,engine,kind];
