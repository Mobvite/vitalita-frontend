<script setup>
import {ref} from "vue";

const props = defineProps({
  inputId: {type: String, required: true},
  placeholder: {type: String, default: ''}
});
const tags = defineModel({type: Array, default: () => []});
const newTag = ref('');

function addTag() {
  const value = newTag.value.trim();
  if (value && !tags.value.includes(value)) tags.value = [...tags.value, value];
  newTag.value = '';
}

function removeTag(tag) {
  tags.value = tags.value.filter(item => item !== tag);
}
</script>

<template>
  <div class="flex flex-column gap-2">
    <div class="flex gap-2">
      <pv-input-text :id="props.inputId" v-model="newTag" class="flex-1" :placeholder="placeholder" @keydown.enter.prevent="addTag"/>
      <pv-button icon="pi pi-plus" outlined :aria-label="$t('common.add')" @click="addTag"/>
    </div>
    <ul v-if="tags.length" class="list-none p-0 m-0 flex flex-wrap gap-2" :aria-label="placeholder">
      <li v-for="tag in tags" :key="tag">
        <pv-tag severity="secondary" class="gap-1">
          <span>{{ tag }}</span>
          <button type="button" class="tag-remove" :aria-label="$t('common.remove-item', {item: tag})" @click="removeTag(tag)">
            <i class="pi pi-times text-xs" aria-hidden="true"/>
          </button>
        </pv-tag>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tag-remove { border: none; background: transparent; cursor: pointer; padding: 0 0 0 0.25rem; color: inherit; }
</style>
