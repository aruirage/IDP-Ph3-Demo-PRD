import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVercelRequest} from './vercel-request.mjs';
test('rewritten requests retain chapter parameters supplied separately by Vercel',()=>{const result=parseVercelRequest({url:'/api/prd?__route=/api/file',query:{__route:'/api/file',path:'prd/chapter-01.md'}});assert.equal(result.pathname,'/api/file');assert.equal(result.query.get('path'),'prd/chapter-01.md');});
test('original request URL remains authoritative when rewrite captures share a query name',()=>{const result=parseVercelRequest({url:'/api/file?path=prd%2Fchapter-01.md',query:{__route:'/api/file',path:'file'}});assert.equal(result.pathname,'/api/file');assert.equal(result.query.get('path'),'prd/chapter-01.md');});
test('local and older deployed rewrite forms remain supported',()=>{for(const url of ['/api/file?path=prd%2Fchapter-01.md','/api/prd?__path=%2Fapi%2Ffile&path=prd%2Fchapter-01.md']){const result=parseVercelRequest({url});assert.equal(result.pathname,'/api/file');assert.equal(result.query.get('path'),'prd/chapter-01.md');}});
