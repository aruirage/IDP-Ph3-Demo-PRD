import './prdBridge'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@unocss/reset/tailwind.css'
import 'virtual:uno.css'
import '@/styles/var.css'
import '@/styles/index.scss'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import AppFormItem from '@/components/AppFormItem.vue'
import RequiredTag from '@/components/RequiredTag.vue'

const app = createApp(App)
app.component('AppFormItem', AppFormItem)
app.component('RequiredTag', RequiredTag)
app.use(i18n)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
