<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Filter, Calendar } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { SyncRun } from '@/mocks/phase3'
const props=defineProps<{runs:SyncRun[]}>(),{t}=useI18n()
const statusFilters=computed(()=>['syncing','success','failed'].map(value=>({value,text:t('phase3.'+value)})))
const triggerFilters=computed(()=>['auto','manual'].map(value=>({value,text:t('phase3.'+value)})))
const statuses=ref<string[]>([]),triggers=ref<string[]>([]),dates=ref<[string,string]|null>(null)
const filtered=computed(()=>props.runs.filter(run=>{
 const day=run.start.slice(0,10).replace(/\//g,'-')
 return (!statuses.value.length||statuses.value.includes(run.status))&&(!triggers.value.length||triggers.value.includes(run.trigger))&&(!dates.value||(day>=dates.value[0]&&day<=dates.value[1]))
}))
const page=ref(1),pageSize=ref(10),sortOrder=ref<string|null>(null)
const sorted=computed(()=>sortOrder.value?[...filtered.value].sort((a,b)=>((parseFloat(a.duration)||0)-(parseFloat(b.duration)||0))*(sortOrder.value==='ascending'?1:-1)):filtered.value)
const paged=computed(()=>sorted.value.slice((page.value-1)*pageSize.value,page.value*pageSize.value))
watch([statuses,triggers,dates,pageSize,sortOrder],()=>{page.value=1},{deep:true})
watch(()=>filtered.value.length,total=>{page.value=Math.min(page.value,Math.max(1,Math.ceil(total/pageSize.value)))})
function changeSort(event:{order:string|null}){sortOrder.value=event.order}
function reset(){statuses.value=[];triggers.value=[];dates.value=null}
</script>
<template><section class="p3-history"><div class="p3-history-toolbar">
<el-popover trigger="click" width="280"><template #reference><el-button :icon="Filter">{{t('phase3.filter')}}<template v-if="statuses.length+triggers.length"> ({{statuses.length+triggers.length}})</template></el-button></template>
<div class="p3-filter-label">{{t('phase3.status')}}</div><el-select v-model="statuses" multiple clearable collapse-tags collapse-tags-tooltip :aria-label="t('phase3.status')" style="width:100%;margin-bottom:12px"><el-option v-for="item in statusFilters" :key="item.value" :value="item.value" :label="item.text"/></el-select>
<div class="p3-filter-label">{{t('phase3.trigger')}}</div><el-select v-model="triggers" multiple clearable collapse-tags collapse-tags-tooltip :aria-label="t('phase3.trigger')" style="width:100%;margin-bottom:12px"><el-option v-for="item in triggerFilters" :key="item.value" :value="item.value" :label="item.text"/></el-select>
<el-button link type="primary" @click="reset">{{t('phase3.resetFilters')}}</el-button></el-popover>
<el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :prefix-icon="Calendar" :start-placeholder="t('phase3.selectDate')" :end-placeholder="t('phase3.endDate')" style="width:0;min-width:0;flex:1"/>
</div><el-table :data="paged" row-key="id" border @sort-change="changeSort">
<el-table-column prop="start" :label="t('phase3.started')" min-width="180"/>
<el-table-column prop="status" :label="t('phase3.status')" min-width="100"><template #default="{row}"><el-tag :type="row.status==='failed'?'danger':row.status==='success'?'success':'primary'">{{t('phase3.'+row.status)}}</el-tag></template></el-table-column>
<el-table-column prop="duration" :label="t('phase3.duration')" min-width="90" sortable="custom"/>
<el-table-column prop="trigger" :label="t('phase3.trigger')" min-width="100"><template #default="{row}">{{t('phase3.'+row.trigger)}}</template></el-table-column>
<el-table-column prop="reason" :label="t('phase3.reason')" min-width="240"><template #default="{row}">{{row.reason||'—'}}</template></el-table-column>
</el-table><div class="p3-history-pagination"><span>{{t('businessRules.masterData.pagination.resultTotal',{count:filtered.length})}}</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="filtered.length" :page-sizes="[10,20,50]" layout="sizes, prev, pager, next, jumper"/></div></section></template>
<style scoped>.p3-history-pagination{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;font-size:14px}.p3-history-pagination :deep(.el-pagination){--el-pagination-button-height:28px}.p3-history-toolbar{display:flex;gap:12px;align-items:center;margin-bottom:20px;width:100%;flex-wrap:nowrap}.p3-filter-label{font-weight:600;margin:8px 0}.p3-history{padding:0;overflow:auto;flex:1;min-height:0}</style>
