<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  List,
  FolderOpened,
  UploadFilled,
  Notebook,
  Expand,
  Fold,
  Setting,
  Connection,
  Document,
  CircleCheck,
  Cpu,
  Collection,
  Link,
  Tools,
  User,
  Key,
  Lock,
  ArrowDown,
  ArrowRight,
  DataAnalysis
} from '@element-plus/icons-vue'
import { findMenuParentKey, menuItems, type MenuItem } from '@/constants/menu'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()

const iconMap: Record<string, object> = {
  List,
  FolderOpened,
  UploadFilled,
  Notebook,
  Setting,
  Connection,
  Document,
  CircleCheck,
  Cpu,
  Collection,
  Link,
  Tools,
  User,
  Key,
  Lock,
  DataAnalysis
}

function getDefaultExpandedGroups(): string[] {
  return menuItems.filter((item) => item.children?.length).map((item) => item.key)
}

const activeMenu = computed(() => (route.meta.menu as string) || 'upload')
const expandedGroups = ref<string[]>(getDefaultExpandedGroups())

watch(
  activeMenu,
  (key) => {
    const parentKey = findMenuParentKey(key)
    if (parentKey && !expandedGroups.value.includes(parentKey)) {
      expandedGroups.value.push(parentKey)
    }
  },
  { immediate: true }
)

function isGroupActive(item: MenuItem) {
  return item.children?.some((child) => child.key === activeMenu.value) ?? false
}

function isGroupExpanded(key: string) {
  return expandedGroups.value.includes(key)
}

function toggleGroup(key: string) {
  if (expandedGroups.value.includes(key)) {
    expandedGroups.value = expandedGroups.value.filter((item) => item !== key)
    return
  }
  expandedGroups.value.push(key)
}

function navigate(path: string) {
  router.push(path)
}

function handleChildClick(child: MenuItem) {
  if (child.externalUrl) {
    window.location.assign(child.externalUrl)
    return
  }
  if (child.path) {
    navigate(child.path)
  }
}

function handleParentClick(item: MenuItem) {
  toggleGroup(item.key)
  const firstChild = item.children?.[0]
  if (firstChild?.path) {
    navigate(firstChild.path)
  }
}
</script>

<template>
  <aside
    class="v-app-sidebar"
    :class="{ 'is-collapsed': collapsed }"
  >
    <div class="v-app-sidebar__toolbar layout-border__bottom">
      <button
        type="button"
        class="v-app-sidebar__menu-toggle"
        :aria-label="$t('common.menuToggle')"
        @click="emit('toggle')"
      >
        <el-icon :size="18">
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </button>
    </div>

    <div class="v-app-sidebar__body layout-border__right">
      <nav class="v-app-sidebar__nav">
        <template v-for="item in menuItems" :key="item.key">
          <template v-if="item.children?.length">
            <el-tooltip
              :content="$t(item.labelKey)"
              placement="right"
              :disabled="!collapsed"
            >
              <button
                type="button"
                class="v-app-sidebar__item"
                :class="{ 'is-active': isGroupActive(item) }"
                @click="handleParentClick(item)"
              >
                <el-icon :size="20">
                  <component :is="iconMap[item.icon]" />
                </el-icon>
                <span v-if="!collapsed" class="v-app-sidebar__label">{{ $t(item.labelKey) }}</span>
                <el-icon
                  v-if="!collapsed"
                  :size="14"
                  class="v-app-sidebar__arrow"
                >
                  <ArrowDown v-if="isGroupExpanded(item.key)" />
                  <ArrowRight v-else />
                </el-icon>
              </button>
            </el-tooltip>

            <div
              v-if="!collapsed && isGroupExpanded(item.key)"
              class="v-app-sidebar__subnav"
            >
              <el-tooltip
                v-for="child in item.children"
                :key="child.key"
                :content="$t(child.labelKey)"
                placement="right"
                :disabled="true"
              >
                <button
                  type="button"
                  class="v-app-sidebar__item v-app-sidebar__item--child"
                  :class="{ 'is-active': activeMenu === child.key }"
                  @click="handleChildClick(child)"
                >
                  <el-icon :size="18">
                    <component :is="iconMap[child.icon]" />
                  </el-icon>
                  <span class="v-app-sidebar__label">{{ $t(child.labelKey) }}</span>
                </button>
              </el-tooltip>
            </div>
          </template>

          <el-tooltip
            v-else
            :content="$t(item.labelKey)"
            placement="right"
            :disabled="!collapsed"
          >
            <button
              type="button"
              class="v-app-sidebar__item"
              :class="{ 'is-active': activeMenu === item.key }"
              @click="navigate(item.path!)"
            >
              <el-icon :size="20">
                <component :is="iconMap[item.icon]" />
              </el-icon>
              <span v-if="!collapsed" class="v-app-sidebar__label">{{ $t(item.labelKey) }}</span>
            </button>
          </el-tooltip>
        </template>
      </nav>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.v-app-sidebar {
  width: var(--left-menu-max-width);
  min-width: var(--left-menu-max-width);
  align-self: stretch;
  background: var(--left-menu-bg-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width var(--transition-time-02), min-width var(--transition-time-02);

  &.is-collapsed {
    width: var(--left-menu-min-width);
    min-width: var(--left-menu-min-width);
  }

  &__toolbar {
    height: var(--tags-view-height);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 10px;
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--sidebar-icon-color);
    cursor: pointer;
    transition: none;
  }

  &__nav {
    flex: 1;
    min-height: 0;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: auto;
  }

  &__subnav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 4px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--app-section-gap);
    margin: 0 8px;
    padding: 10px 12px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--sidebar-icon-color);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: none;

    &.is-active {
      color: var(--sidebar-icon-active);
      background: var(--el-color-primary-light-9);
    }

    &:hover:not(.is-active) {
      background: #f9fafb;
    }

    &--child {
      margin-left: 20px;
      margin-right: 8px;
      padding: 8px 12px;
      font-size: 13px;
    }
  }

  &__arrow {
    margin-left: auto;
    flex-shrink: 0;
  }

  &.is-collapsed &__item {
    justify-content: center;
    padding: 10px;
  }

  &__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
