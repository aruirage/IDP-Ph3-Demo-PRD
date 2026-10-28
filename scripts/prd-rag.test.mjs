import test from 'node:test';import assert from 'node:assert/strict';import{answerPrd}from'./prd-model-selector.mjs';
const sources=[{text:'最高分并列时需要人工确认。'}];
const config=value=>({key:'test',model:'test',url:'https://example.test/chat',fetchImpl:async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(value)}}]})})});
test('RAG returns cited synthesis and unchanged evidence',async()=>{const result=await answerPrd('同分怎么办',sources,config({answer:[{text:'最高分同分需要人工确认。',ids:['S1']}]}));assert.deepEqual(result.answer,[{text:'最高分同分需要人工确认。',citations:[1]}]);assert.equal(result.matches[0],sources[0])});
test('RAG rejects uncited answers and invented source IDs',async()=>{for(const ids of [[],['S99']])await assert.rejects(answerPrd('问题',sources,config({answer:[{text:'回答',ids}]})),/出处/)});
test('RAG handles unsupported questions and missing model honestly',async()=>{assert.deepEqual((await answerPrd('问题',sources,config({answer:[]}))).answer,[]);assert.equal((await answerPrd('问题',sources,{key:''})).configured,false)});
