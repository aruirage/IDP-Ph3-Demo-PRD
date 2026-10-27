import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Recover tabs opened by the previous Vite --open false startup argument.
    { path: "/false", redirect: "/business-rules/master-data" },
    {
      path: '/',
      component: AppLayout,
      redirect: '/upload',
      children: [
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('@/views/tasks/TasksListView.vue'),
          meta: { titleKey: 'menu.tasks', menu: 'tasks' }
        },
        {
          path: 'tasks/preprocess-confirmation/:id',
          name: 'TaskPreprocessConfirmation',
          component: () =>
            import('@/views/tasks/preprocess-confirmation/PreprocessConfirmationTaskView.vue'),
          meta: { titleKey: 'route.taskPreprocess', menu: 'tasks' }
        },
        {
          path: 'tasks/ocr-extraction/:id',
          name: 'TaskOcrExtraction',
          component: () => import('@/views/tasks/ocr-extraction/OcrExtractionTaskView.vue'),
          meta: { titleKey: 'route.taskOcr', menu: 'tasks' }
        },
        {
          path: 'tasks/verification/:id',
          name: 'TaskVerification',
          component: () => import('@/views/tasks/verification/VerificationTaskView.vue'),
          meta: { titleKey: 'route.taskVerification', menu: 'tasks' }
        },
        {
          path: 'tasks/export/:id',
          name: 'TaskExport',
          component: () => import('@/views/tasks/export/ExportTaskView.vue'),
          meta: { titleKey: 'route.taskExport', menu: 'tasks' }
        },
        {
          path: 'business-rules/doc-types',
          name: 'DocTypeSettings',
          component: () =>
            import('@/views/business-rules/doc-types/DocTypeSettingsView.vue'),
          meta: { titleKey: 'menu.docTypes', menu: 'doc-types' }
        },
        {
          path: 'business-rules/business-scene',
          name: 'BusinessSceneSettings',
          component: () =>
            import('@/views/business-rules/business-scene/BusinessSceneEmbedView.vue'),
          meta: { titleKey: 'menu.businessScene', menu: 'business-scene-settings' }
        },
        {
          path: 'business-rules/data-mapping',
          name: 'DataMapping',
          component: () => import('@/views/business-rules/data-mapping/DataMappingView.vue'),
          meta: { titleKey: 'menu.dataMapping', menu: 'data-mapping' }
        },
        {
          path: 'business-rules/verification-settings',
          name: 'VerificationSettings',
          component: () =>
            import('@/views/business-rules/verification-settings/VerificationSettingsView.vue'),
          meta: { titleKey: 'menu.verificationSettings', menu: 'verification-settings' }
        },
        {
          path: 'business-rules/model-settings',
          name: 'ModelSettings',
          component: () =>
            import('@/views/business-rules/model-settings/ModelSettingsView.vue'),
          meta: { titleKey: 'menu.modelSettings', menu: 'model-settings' }
        },
        {
          path: 'business-rules/api-management',
          name: 'ApiManagement',
          component: () =>
            import('@/views/business-rules/api-management/ApiManagementView.vue'),
          meta: { titleKey: 'menu.apiManagement', menu: 'api-management' }
        },
        {
          path: 'business-rules/master-data',
          name: 'MasterData',
          component: () =>
            import('@/views/business-rules/master-data/MasterDataConfigView.vue'),
          meta: { titleKey: 'menu.masterData', menu: 'master-data' }
        },
        {
          path: 'cases',
          name: 'Cases',
          component: () => import('@/views/cases/CasesListView.vue'),
          meta: { titleKey: 'menu.cases', menu: 'cases' }
        },
        {
          path: 'cases/:caseId',
          name: 'CaseDetail',
          component: () => import('@/views/cases/CaseDetailView.vue'),
          meta: { titleKey: 'case.detail.title', menu: 'cases' }
        },
        {
          path: 'upload',
          name: 'Upload',
          component: () => import('@/views/upload/UploadView.vue'),
          meta: { titleKey: 'menu.upload', menu: 'upload' }
        },
        {
          path: 'messages',
          name: 'SystemMessages',
          component: () => import('@/views/messages/SystemMessagesView.vue'),
          meta: { titleKey: 'page.messages.title' }
        },
        {
          path: 'system-settings/users',
          name: 'UserManagement',
          component: () => import('@/views/system-settings/UserManagementView.vue'),
          meta: { titleKey: 'menu.userManagement', menu: 'user-management' }
        },
        {
          path: 'system-settings/roles',
          name: 'RoleManagement',
          component: () => import('@/views/system-settings/RoleManagementView.vue'),
          meta: { titleKey: 'menu.roleManagement', menu: 'role-management' }
        },
        {
          path: 'system-settings/security',
          name: 'SecuritySettings',
          component: () => import('@/views/system-settings/SecuritySettingsView.vue'),
          meta: { titleKey: 'menu.securitySettings', menu: 'security-settings' }
        },
        {
          path: 'system-settings/usage-statistics',
          name: 'UsageStatistics',
          component: () =>
            import('@/views/system-settings/usage-statistics/UsageStatisticsView.vue'),
          meta: { titleKey: 'menu.usageStatistics', menu: 'usage-statistics' }
        }
      ]
    }
  ]
})

export default router
