import {lookup} from 'node:dns/promises';
import{isIP}from'node:net';
import{answerPrd}from'./prd-model-selector.mjs';
export async function userModelOptions(value,{lookupImpl=lookup}={}){
 if(value===undefined)return undefined;
 if(!value||typeof value.url!=='string'||typeof value.model!=='string'||typeof value.key!=='string'||!value.key.trim()||!value.model.trim())throw Error('请填写接口地址、模型名称和 API Key');
 let endpoint;try{endpoint=new URL(value.url)}catch{throw Error('接口地址格式不正确')}
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.port&&endpoint.port!=='443')throw Error('请使用不含认证参数的公共 HTTPS 接口地址');
 const host=endpoint.hostname.replace(/^\[|\]$/g,'');const addresses=isIP(host)?[{address:host}]:await lookupImpl(host,{all:true});
 const privateAddress=address=>{if(address.includes(':'))return !/^[23]/i.test(address);const [a,b]=address.split('.').map(Number);return a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a>=224||a===198&&(b===18||b===19)};
 if(!addresses.length||addresses.some(({address})=>privateAddress(address)))throw Error('模型接口须使用公共网络地址');
 return {url:endpoint.href,model:value.model.trim(),key:value.key.trim(),fetchImpl:(url,options)=>fetch(url,{...options,redirect:'error'})};
}
export async function testUserModel(value){const options=await userModelOptions(value);if(!options)throw Error('请填写模型配置');await answerPrd('连接测试是否成功？',[{text:'连接测试成功。'}],options);return {ok:true,message:'连接成功'};}
