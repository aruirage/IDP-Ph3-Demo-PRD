<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Schedule } from '@/mocks/phase3'
const model=defineModel<Schedule>({required:true}),{t,locale}=useI18n()
const weekdays=()=>locale.value==='ja'?['日','月','火','水','木','金','土']:['日','一','二','三','四','五','六']
</script>
<template><div class="p3-schedule"><el-form-item :label="t('phase3.cycle')"><el-select v-model="model.frequency"><el-option v-for="v in (['daily','weekly','monthly','halfyear'] as const)" :key="v" :label="t('phase3.'+v)" :value="v"/></el-select></el-form-item><el-form-item v-if="model.frequency==='weekly'" :label="t('phase3.weekday')"><el-select v-model="model.weekday"><el-option v-for="(d,i) in weekdays()" :key="i" :value="i" :label="d"/></el-select></el-form-item><el-form-item v-if="model.frequency==='halfyear'" :label="t('phase3.month')"><el-select v-model="model.month"><el-option v-for="n in 6" :key="n" :label="`${n} / ${n+6}`" :value="n"/></el-select></el-form-item><el-form-item v-if="['monthly','halfyear'].includes(model.frequency)" :label="t('phase3.day')"><el-select v-model="model.day"><el-option v-for="n in 31" :key="n" :value="n" :label="String(n)"/></el-select></el-form-item><el-form-item :label="t('phase3.time')"><el-time-picker v-model="model.time" format="HH:mm" value-format="HH:mm" :clearable="false"/></el-form-item></div></template>
<style scoped>.p3-schedule{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}.p3-schedule .el-form-item{width:130px}.p3-schedule .el-form-item:last-child{width:260px}</style>
