// Phase 3 additions layered over the imported phase 2 scene editor.
export function addSceneBusinessKeys(main, html) {
 const replace=(from,to)=>{if(!main.includes(from))throw Error('Scene integration anchor missing: '+from);main=main.replace(from,to)};
 replace("      mainKey: '',\n      docFieldLinks:","      mainKey: '',\n      businessKeys: [createEmptySceneBusinessKey(), createEmptySceneBusinessKey()],\n      docFieldLinks:");
 replace("      sceneSetupDraft.mainKey = '';", "      sceneSetupDraft.mainKey = '';\n      sceneSetupDraft.businessKeys = [createEmptySceneBusinessKey(), createEmptySceneBusinessKey()];");
 replace('      sceneSetupDraft.description = data.scene?.description', "      sceneSetupDraft.businessKeys = [0, 1].map(index => normalizeSceneBusinessKey(data.scene?.businessKeys?.[index]));\n      sceneSetupDraft.description = data.scene?.description");
 replace("        mainKey: payload.mainKey || '',", "        mainKey: payload.mainKey || '',\n        businessKeys: (payload.businessKeys || []).flatMap(key => key?.docType && key?.field ? [[key.docType, key.field, String(key.name || '').trim(), key.required !== false]] : []),");
 replace('        mainKey: sceneSetupDraft.mainKey,\n        docFieldLinks:', '        mainKey: sceneSetupDraft.mainKey,\n        businessKeys: sceneSetupDraft.businessKeys,\n        docFieldLinks:');
 replace('        mainKey: data.scene?.primaryKey,', '        mainKey: data.scene?.primaryKey,\n        businessKeys: data.scene?.businessKeys,');
 replace("      data.scene.primaryKey = sceneSetupDraft.mainKey || '';", "      data.scene.primaryKey = sceneSetupDraft.mainKey || '';\n      data.scene.businessKeys = sceneSetupDraft.businessKeys.flatMap(key => (key?.docType && key?.field) ? [{docType:key.docType,field:key.field,name:String(key.name||'').trim()||key.field,required:key.required!==false}] : []);");
 replace('    function persistSceneSetupDraft(options = {}) {', `    function persistSceneSetupDraft(options = {}) {
      const businessKeyError=validateSceneBusinessKeys(sceneSetupDraft,!!options.validate);
      if(businessKeyError){ElementPlus.ElMessage.warning(businessKeyError);return false;}`);
 replace('    function validateSceneAggregateDraft(draft) {', `    function validateSceneAggregateDraft(draft) {
      const businessKeyError=validateSceneBusinessKeys(draft,true);
      if(businessKeyError)return businessKeyError;`);
 replace("if (!draft.mainKey) return '業務キーを選択してください';", "if (!draft.mainKey) return '主帳票の主キーを選択してください';");
 replace('    function getSceneSetupFieldOptions(docType) {', `    const sceneBusinessKeyOptions = computed(() => sceneSetupDraft.documents.flatMap(doc =>
      getSceneSetupFieldOptions(doc.type).map(field => ({value:JSON.stringify([doc.type,field]),label:getDocDisplayLabel(doc.type)+' / '+field}))
    ));
    function createEmptySceneBusinessKey() { return {docType:'',field:'',name:'',required:true}; }
    function normalizeSceneBusinessKey(key) {
      if(!key?.docType || !key?.field)return createEmptySceneBusinessKey();
      return {docType:key.docType,field:key.field,name:String(key.name||''),required:key.required!==false};
    }
    function sceneBusinessKeyOptionValue(key) {return key?.docType && key?.field ? JSON.stringify([key.docType,key.field]) : '';}
    function getSceneBusinessKey(index) {return sceneSetupDraft.businessKeys[index] || createEmptySceneBusinessKey();}
    function patchSceneBusinessKey(index,patch) {sceneSetupDraft.businessKeys[index]={...getSceneBusinessKey(index),...patch};}
    function setSceneBusinessKeyDoc(index,docType) {patchSceneBusinessKey(index,{docType:docType||'',field:''});}
    function setSceneBusinessKeyField(index,field) {patchSceneBusinessKey(index,{field:field||''});}
    function setSceneBusinessKeyName(index,name) {patchSceneBusinessKey(index,{name:name||''});}
    function setSceneBusinessKeyRequired(index,required) {patchSceneBusinessKey(index,{required:!!required});}
    function sceneBusinessKeyFieldDisabled(index,field) {const other=getSceneBusinessKey(1-index);return other.docType===getSceneBusinessKey(index).docType && other.field===field;}
    function validateSceneBusinessKeys(draft,required) {
      const values=(draft.businessKeys || []).map(key => sceneBusinessKeyOptionValue(key));
      if(!values.some(Boolean))return '';
      if(required && (values.length!==2 || values.some(value=>!value)))return t('業務キーを2件選択してください');
      if(values[0] && values[0]===values[1])return t('業務キーには異なるフィールドを選択してください');
      const valid=new Set(sceneBusinessKeyOptions.value.map(option=>option.value));
      if(values.some(value=>value && !valid.has(value)))return t('関連帳票の有効なフィールドを選択してください');
      return '';
    }
    watch(sceneBusinessKeyOptions, options => {
      const valid=new Set(options.map(option=>option.value));
      sceneSetupDraft.businessKeys=sceneSetupDraft.businessKeys.map(key => {
        if(!key)return createEmptySceneBusinessKey();
        const value=sceneBusinessKeyOptionValue(key);
        return value && !valid.has(value) ? {...key,docType:'',field:''} : key;
      });
    });
    function getSceneSetupFieldOptions(docType) {`);
 replace('      sceneSetupDraft,\n', '      sceneSetupDraft,\n      sceneBusinessKeyOptions,\n      getSceneBusinessKey, setSceneBusinessKeyDoc, setSceneBusinessKeyField, setSceneBusinessKeyName, setSceneBusinessKeyRequired, sceneBusinessKeyFieldDisabled,\n');
 // Labels pass through the existing Japanese/Chinese translator.
 replace('    const storedUiLanguage =', `    const businessKeyLabels = {'帳票を選択':'选择账票','フィールドを選択':'选择字段','業務キー':'业务键','業務キー1':'业务键1','業務キー2':'业务键2','帳票のフィールドを選択':'选择账票字段','業務キーを2件選択してください':'请选择两个业务键','業務キーには異なるフィールドを選択してください':'两个业务键不能选择同一字段','関連帳票の有効なフィールドを選択してください':'请选择关联账票中的有效字段','業務キー名':'业务键名称','業務キー名を入力':'输入业务键名称','必須／任意':'必填／任意','必須':'必填','任意':'任意'};
    const storedUiLanguage =`);
 replace('    function translateUiString(', '    function translateUiString('); // Fail fast if upstream translator changes.
 // Insert the small label dictionary at the translator entry, preserving its other rules.
 main=main.replace(/(function translateUiString\((\w+)\)\s*\{)/, '$1\n      if(businessKeyLabels[$2])return businessKeyLabels[$2];');
 const anchor='                <section class="wf-setup-step1-section">\n              <div class="wf-setup-aggregation-stack">';
 if(!html.includes(anchor))throw Error('Business key card insertion anchor missing');
 const card=`
                  <section class="wf-setup-docs-panel scene-business-keys" aria-label="業務キー">
                    <div class="wf-step-card-head"><span class="wf-step-card-index">3</span><inspector-title :title="t('業務キー')"></inspector-title></div>
                    <div v-for="index in [0,1]" :key="index" class="inspector-field-row scene-business-key-row" style="margin-top:16px">
                      <label :for="'scene-business-key-'+index">{{ t(index===0?'業務キー1':'業務キー2') }}</label>
                      <div class="scene-business-key-controls" style="display:flex;flex-direction:column;gap:8px">
                        <div class="scene-business-key-line" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
                          <el-input :id="'scene-business-key-'+index" :model-value="getSceneBusinessKey(index).name" @update:model-value="value=>setSceneBusinessKeyName(index,value)" maxlength="32" clearable :aria-label="t(index===0?'業務キー1':'業務キー2')+' '+t('業務キー名')" :placeholder="t('業務キー名を入力')" style="flex:1;min-width:180px"></el-input>
                          <el-radio-group :model-value="getSceneBusinessKey(index).required?'REQUIRED':'OPTIONAL'" @update:model-value="value=>setSceneBusinessKeyRequired(index,value==='REQUIRED')" :aria-label="t(index===0?'業務キー1':'業務キー2')+' '+t('必須／任意')" style="flex:none">
                            <el-radio-button value="REQUIRED" :label="t('必須')"></el-radio-button>
                            <el-radio-button value="OPTIONAL" :label="t('任意')"></el-radio-button>
                          </el-radio-group>
                        </div>
                        <div class="scene-business-key-line" style="display:flex;gap:12px;flex-wrap:wrap">
                          <el-select :model-value="getSceneBusinessKey(index).docType" @change="value=>setSceneBusinessKeyDoc(index,value)" :aria-label="t(index===0?'業務キー1':'業務キー2')+' '+t('帳票を選択')" clearable filterable :placeholder="t('帳票を選択')" style="flex:1;min-width:180px">
                            <el-option v-for="doc in sceneSetupDraft.documents" :key="doc.type" :value="doc.type" :label="getDocDisplayLabel(doc.type)" />
                          </el-select>
                          <el-select :model-value="getSceneBusinessKey(index).field" @change="value=>setSceneBusinessKeyField(index,value)" :aria-label="t(index===0?'業務キー1':'業務キー2')+' '+t('フィールドを選択')" :disabled="!getSceneBusinessKey(index).docType" clearable filterable :placeholder="t('フィールドを選択')" style="flex:1;min-width:180px">
                            <el-option v-for="field in getSceneSetupFieldOptions(getSceneBusinessKey(index).docType)" :key="field" :value="field" :label="field" :disabled="sceneBusinessKeyFieldDisabled(index,field)" />
                          </el-select>
                        </div>
                      </div>
                    </div>
                  </section>
`;
 html=html.replace('<span class="wf-step-card-index">3</span>\n                      <inspector-title title="案件集約ルール"','<span class="wf-step-card-index">4</span>\n                      <inspector-title title="案件集約ルール"');
 html=html.replace(anchor,'<section class="wf-setup-step1-section">'+card+'</section>\n'+anchor);
 return {main,html};
}
