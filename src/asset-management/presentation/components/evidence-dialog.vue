<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useAssetManagementStore from "../../application/asset-management.store.js";
import {ALLOWED_CONTENT_TYPES} from "../../domain/model/clinical-asset.entity.js";
import {useDateFormat} from "../../../shared/presentation/composables/use-date-format.js";

const props = defineProps({
  exam: {type: Object, default: null},
  olderAdultId: {type: Number, default: null},
  readOnly: {type: Boolean, default: false}
});
const visible = defineModel('visible', {type: Boolean, default: false});
const {t} = useI18n();
const toast = useToast();
const store = useAssetManagementStore();
const {formatDateTime} = useDateFormat();

const description = ref('');
const isDragging = ref(false);
const items = computed(() => props.exam ? store.getEvidencesForExam(props.exam.id) : []);

async function upload(file) {
  if (!file || !props.exam) return;
  const saved = await store.attachEvidence({olderAdultId: props.olderAdultId, examId: props.exam.id, file, description: description.value});
  if (saved) {
    toast.add({severity: 'success', summary: t('asset-management.evidence.saved'), life: 3000});
    description.value = '';
  }
}

function onFileChange(event) {
  upload(event.target.files[0]);
  event.target.value = '';
}

function onDrop(event) {
  isDragging.value = false;
  upload(event.dataTransfer.files[0]);
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :style="{width: '40rem'}" :breakpoints="{'640px': '95vw'}"
             :header="$t('asset-management.evidence.title', {name: exam?.examType ?? ''})">
    <p v-if="!items.length" class="text-600 mt-0">{{ $t('asset-management.evidence.empty') }}</p>
    <ul v-else class="list-none p-0 m-0 grid">
      <li v-for="item in items" :key="item.evidence.id" class="col-12 sm:col-6">
        <figure class="evidence-card m-0">
          <a :href="item.asset.storageUrl" target="_blank" rel="noopener noreferrer"
             :aria-label="$t('asset-management.evidence.open', {name: item.asset.fileName})">
            <img v-if="item.asset.isImage()" :src="item.asset.storageUrl" :alt="item.evidence.description || item.asset.fileName" class="evidence-image"/>
            <span v-else class="evidence-file" aria-hidden="true"><i class="pi pi-file-pdf text-4xl"/></span>
          </a>
          <figcaption class="p-2">
            <p class="m-0 text-sm font-semibold white-space-nowrap overflow-hidden text-overflow-ellipsis">{{ item.asset.fileName }}</p>
            <p class="m-0 text-xs text-600">{{ formatDateTime(item.asset.uploadedAt) }}</p>
            <p v-if="item.evidence.description" class="m-0 text-xs">{{ item.evidence.description }}</p>
          </figcaption>
        </figure>
      </li>
    </ul>

    <template v-if="!readOnly">
      <pv-divider/>
      <div class="flex flex-column gap-2 mb-3">
        <label for="evidence-description" class="text-sm font-medium">{{ $t('asset-management.evidence.description') }}</label>
        <pv-input-text id="evidence-description" v-model="description"/>
      </div>
      <label class="drop-zone" :class="{'drop-zone--active': isDragging}" for="evidence-file"
             @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="onDrop">
        <i class="pi pi-cloud-upload text-3xl" aria-hidden="true"/>
        <span class="font-semibold">{{ $t('asset-management.evidence.drop') }}</span>
        <span class="text-xs text-600">{{ $t('asset-management.evidence.formats') }}</span>
        <input id="evidence-file" type="file" class="sr-only" :accept="ALLOWED_CONTENT_TYPES.join(',')"
               :disabled="store.isUploading" @change="onFileChange"/>
      </label>
      <pv-progress-spinner v-if="store.isUploading" style="width: 2rem; height: 2rem" class="mt-2" :aria-label="$t('common.loading')"/>
      <div aria-live="polite">
        <pv-message v-for="error in store.errors" :key="error" severity="error" class="mt-2">{{ $t(error) }}</pv-message>
      </div>
    </template>
  </pv-dialog>
</template>

<style scoped>
.evidence-card { border: 1px solid var(--vt-border); border-radius: 12px; overflow: hidden; background: var(--vt-surface); }
.evidence-image { width: 100%; height: 9rem; object-fit: cover; }
.evidence-file { display: grid; place-items: center; height: 9rem; background: var(--vt-background); color: #DC2626; }
.drop-zone {
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem; padding: 1.5rem;
  border: 2px dashed var(--vt-secondary); border-radius: 12px; background: var(--vt-mint);
  color: var(--vt-primary); cursor: pointer; text-align: center;
}
.drop-zone--active { background: #CCFBF1; }
.drop-zone:focus-within { outline: 3px solid var(--vt-secondary); outline-offset: 2px; }
</style>
