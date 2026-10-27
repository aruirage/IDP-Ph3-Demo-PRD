# 视觉参考基线

用户已明确指定沿用 manual 截图。结合在线产品保留页面基线。用户于 2026-10-22 指定 /Users/jade/project/NeosAI/设计skill/neosai-prototype-design/SKILL.md 及其 references 为后续设计规范。

来源：/Users/jade/project/NeosAI/prototypes/kisoku-nintei/manual/assets/
重点参考：master-data-table.png、master-data-column-settings.png、master-data-import-modal.png、model-usage-assignment-new.png。

保留：左侧业务菜单、主数据二级列表、右侧数据表；白色内容区与浅灰底；蓝色主操作；细边框、轻圆角、紧凑行高；日语产品文案，中文需求及标注。

新增控件沿用现有样式，不新增营销视觉或替换导航。桌面视口 1440×900；本轮不制作独立移动端。

颜色、字体和控件尺寸在组件基线制作时依据截图细化，观察值与候选规范分别记录。

## 本轮组件基线

用户已确认使用 manual 截图，基础说明已通过。按既有 NeosAI 规范补齐共享实现：主色 #175CD3，白色内容区，浅灰背景，边框 #DCDFE6；Noto Sans JP，正文 15px，标题 28px，区块 18px；按钮 4px 圆角，顶栏 48px，侧栏 200px。
这些为本轮实现规范，非声称从截图精确量取的全部像素。产品 Logo 使用既有 logo-CWaP-1CB.png，仅展示图片，不添加系统名称。

组件页和状态页作为可审阅样张；原型为静态 HTML 与共享模块，后续不改底座 runtime。

## 界面文案

不展示注释性说明、示例提示或标题副文案。保留字段标签、必要的时区标识、真实状态、动作确认与校验错误；原型接入限制记录在审阅资料中。

## 当前画面基线

用户指定以 NeosAI-IDP-main.zip 的 prototype/ 目录为整套原型基线。实际工作副本为 /Users/jade/project/NeosAI/IDP/三期/prototype/，本地 Vue 服务端口 5174。原 4173 的主数据和API静态页入口跳转到此服务；旧静态草稿保存在同目录的 .legacy.html 文件，不作为当前画面。
