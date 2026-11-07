import assert from 'node:assert/strict';
import {FiEdit,GiCube,HiCube,HiOutlineCube,BiNetworkChart,BiPencil,BsTextareaT} from 'react-icons/all';
import {FiEdit as fi} from 'react-icons/fi';
import {GiCube as gi} from 'react-icons/gi';
import {HiCube as hi,HiOutlineCube as hiOutline} from 'react-icons/hi';
import {BiNetworkChart as network,BiPencil as pencil} from 'react-icons/bi';
import {BsTextareaT as text} from 'react-icons/bs';
for(const [before,after] of [[FiEdit,fi],[GiCube,gi],[HiCube,hi],[HiOutlineCube,hiOutline],[BiNetworkChart,network],[BiPencil,pencil],[BsTextareaT,text]])assert.equal(before,after);
console.log('PASS all seven direct icon imports are the same exported components');
