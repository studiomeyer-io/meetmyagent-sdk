import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MeetMyAgentClient,MeetMyAgentError,ACP_API_VERSION} from '../dist/index.js';
function fixture(result,{status=200,resultInfo}={}){
 const calls=[];
 const sdk=new MeetMyAgentClient({baseUrl:'https://example.test/',token:'fixture-owner',fetch:async(url,init)=>{calls.push({url:String(url),...init});return Response.json(status===200?{success:true,result,result_info:resultInfo}:{success:false,result:null,errors:[{slug:'not_found',code:1002,message:'Missing'}],request_id:'fixture-request'},{status});}});
 return {sdk,calls};
}
test('directory pagination and current origin-relative route',async()=>{
 const f=fixture([{refKind:'hosted',refId:'a',handle:'example-agent'}],{resultInfo:{count:1,cursor:'next'}});
 const result=await f.sdk.directory.search({limit:1});
 assert.equal(result.cursor,'next');assert.equal(result.items[0].handle,'example-agent');
 assert.equal(f.calls[0].url,'https://example.test/v1/directory?limit=1');assert.equal(f.calls[0].method,'GET');
});
test('public offers serialize structured filters on the current API',async()=>{
 const f=fixture([]);const filter={category:'real-estate',price:{max:35000000}};
 assert.deepEqual(await f.sdk.hosted.offers('example-agent',filter),[]);
 const url=new URL(f.calls[0].url);assert.equal(url.pathname,'/v1/hosted/example-agent/offers');assert.deepEqual(JSON.parse(url.searchParams.get('filter')),filter);
});
test('owner setup carries bearer authorization and never publishes implicitly',async()=>{
 const f=fixture({agent:{status:'draft'},missing:[]});
 const input={name:'Testfirma A',languages:['en'],services:[{key:'support',name:'Support'}]};
 await f.sdk.hostedAgent.setup(input);assert.equal(f.calls.length,1);assert.equal(f.calls[0].url,'https://example.test/v1/me/agent');assert.equal(f.calls[0].method,'PUT');assert.equal(f.calls[0].headers.authorization,'Bearer fixture-owner');assert.deepEqual(JSON.parse(f.calls[0].body),input);
});
test('reviewed imports send the exact explicit revision approval',async()=>{
 const f=fixture({id:'proposal',status:'applied'});
 await f.sdk.hostedAgent.profileImports.approve('proposal',{revision:'reviewed-revision',confirm:true});
 assert.equal(new URL(f.calls[0].url).pathname,'/v1/me/agent/profile-imports/proposal/approve');assert.deepEqual(JSON.parse(f.calls[0].body),{revision:'reviewed-revision',confirm:true});
});
test('notification consent and locale use the current owner route',async()=>{
 const f=fixture({deepLink:'https://t.me/example?start=fixture',expiresAt:1});
 await f.sdk.hostedAgent.notifications.connect({events:['new_request'],consent:true,locale:'en'});
 assert.equal(new URL(f.calls[0].url).pathname,'/v1/me/agent/notifications/connect');assert.deepEqual(JSON.parse(f.calls[0].body),{events:['new_request'],consent:true,locale:'en'});
});
test('current errors and checkout API version are exported',async()=>{
 const f=fixture(null,{status:404});
 await assert.rejects(f.sdk.hosted.get('missing-agent'),error=>error instanceof MeetMyAgentError&&error.httpStatus===404&&error.slug==='not_found'&&error.code===1002&&error.requestId==='fixture-request');
 assert.equal(typeof ACP_API_VERSION,'string');
});
