import { phase3Zh } from './modules/phase3'
import { caseZh } from './modules/case'
import { fieldsZh } from './modules/fields'
import { uploadZh } from './modules/upload'
import { tasksZh } from './modules/tasks'
import { businessRulesZh } from './modules/businessRules'
import { miscZh } from './modules/misc'
import { userManagementZh } from './modules/userManagement'
import { roleManagementZh } from './modules/roleManagement'
import { securitySettingsZh } from './modules/securitySettings'
import { usageStatisticsZh } from './modules/usageStatistics'

export default {
  phase3: phase3Zh,
  menu: {
    upload: '新建上传',
    cases: '案件列表',
    tasks: '我的任务',
    businessRules: '业务规则配置',
    docTypes: '账票类型设置',
    businessScene: '业务场景设置',
    masterData: '主数据设置',
    dataMapping: '数据映射设置',
    verificationSettings: 'AI检证设置',
    modelSettings: '模型设置',
    apiManagement: 'API 管理',
    systemSettings: '系统设定',
    userManagement: '用户管理',
    roleManagement: '权限管理',
    securitySettings: '安全设定',
    usageStatistics: '用量统计'
  },
  common: {
    language: '语言',
    menuToggle: '菜单切换',
    notifications: '站内信',
    close: '关闭',
    ok: 'OK',
    cancel: '取消',
    search: '搜索',
    reset: '重置',
    filterAll: '全部',
    empty: '—',
    noData: '暂无数据',
    required: '必填',
    assign: '分配',
    unassigned: '未分配',
    action: '操作',
    index: '序号'
  },
  placeholder: {
    select: '请选择',
    selectSearch: '输入搜索',
    selectMultiple: '请选择（可多选）',
    input: '请输入',
    selectOrInput: '选择或输入',
    filterAll: '全部',
    dateStart: '开始日期',
    dateEnd: '结束日期',
    required: '必填项',
    empty: '—',
    notSet: '未设置',
    notDetected: '未检出',
    unclassified: '未分类',
    masterMatchStrategy: '匹配策略',
    masterMatchConfirmRule: '人工确认规则',
    searchBy: '按{keyword}搜索',
    selectOrInputSubject: '选择或输入{subject}'
  },
  task: {
    type: {
      'preprocess-confirmation': 'AI 前处理确认',
      'ocr-extraction': 'OCR 抽出确认',
      verification: 'AI 检证确认',
      export: '导出'
    },
    status: {
      pending: '待处理',
      completed: '已处理'
    },
    handle: '处理',
    detail: '详细',
    goCases: '案件列表',
    assignDialogTitle: '任务分配',
    assignSuccess: '已分配给 {name}',
    fields: {
      taskType: '任务类型',
      caseId: '案件键',
      businessScene: '业务场景',
      businessKey: '业务键',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      assignee: '负责人'
    }
  },
  page: {
    cases: {
      title: '案件列表',
      newUpload: '新建上传',
      tabConsolidated: '已集约案件',
      tabPending: '未集约文件',
      tabAll: '全部文件'
    },
    tasks: {
      title: '我的任务'
    },
    upload: {
      title: '新建上传',
      supplementTitle: '补充文档上传',
      supplementAlert: '向案件 {caseId} 上传补充文档',
      businessScene: '业务场景'
    },
    messages: {
      title: '站内信',
      markAllRead: '全部标为已读',
      testSend: '测试发送通知',
      markReadSuccess: '已将 {count} 条标为已读',
      testSendSuccess: '工作流通知已发送',
      status: '状态',
      read: '已读',
      unread: '未读',
      messageTitle: '标题',
      body: '内容',
      caseId: '案件键',
      receivedAt: '接收时间'
    },
    businessScene: {
      title: '业务场景设置',
      timeout1: '加载超时，请检查网络环境。',
      timeout2: '请稍候后刷新页面重试。',
      iframeTitle: '业务场景设置'
    },
    placeholder: {
      comingSoon: '开发中'
    }
  },
  fields: fieldsZh,
  case: caseZh,
  upload: uploadZh,
  tasks: tasksZh,
  businessRules: businessRulesZh,
  imageViewer: miscZh.imageViewer,
  demo: miscZh.demo,
  route: miscZh.route,
  userManagement: userManagementZh,
  roleManagement: roleManagementZh,
  securitySettings: securitySettingsZh,
  usageStatistics: usageStatisticsZh
}
