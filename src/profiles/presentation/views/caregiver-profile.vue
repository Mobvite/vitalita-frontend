<script setup>
import {computed, onMounted, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useIamStore from "../../../../../../vitalita-frontend/src/iam/application/iam.store.js";
import useProfilesStore from "../../../../../../vitalita-frontend/src/profiles/application/profiles.store.js";
import useCareContextStore from "../../../../../../vitalita-frontend/src/shared/application/care-context.store.js";
import {CaregiverProfile} from "../../../../../../vitalita-frontend/src/profiles/domain/model/caregiver-profile.entity.js";
import TagListInput from "../../../../../../vitalita-frontend/src/profiles/presentation/components/tag-list-input.vue";

const {t} = useI18n();
const toast = useToast();
const iamStore = useIamStore();
const store = useProfilesStore();
const careContext = useCareContextStore();

const form = reactive({firstName: '', lastName: '', phoneNumber: '', professionalTitle: '', bio: '', certifications: []});
const shownProfile = computed(() => iamStore.isCaregiver ? store.caregiverProfile : store.responsibleCaregiver);

function fillForm() {
  if (!store.caregiverProfile) return;
  const {firstName, lastName, phoneNumber, professionalTitle, bio, certifications} = store.caregiverProfile;
  Object.assign(form, {firstName, lastName, phoneNumber, professionalTitle, bio, certifications: [...certifications]});
}

async function load() {
  await store.initialize(iamStore.currentUserId, iamStore.isCaregiver);
  if (iamStore.isCaregiver) fillForm();
  else await store.fetchResponsibleCaregiver();
}

async function save() {
  const updated = new CaregiverProfile({...store.caregiverProfile, ...form});
  if (await store.updateCaregiverProfile(updated)) {
    toast.add({severity: 'success', summary: t('profiles.caregiver.saved'), life: 3000});
  }
}

onMounted(load);
watch(() => careContext.selectedOlderAdultId, () => { if (iamStore.isFamilyMember) store.fetchResponsibleCaregiver(); });
</script>

<template>
  <section class="grid" aria-labelledby="caregiver-title">
    <div class="col-12 lg:col-4">
      <article class="vt-card flex flex-column align-items-center text-center gap-2" aria-live="polite">
        <pv-avatar :label="shownProfile?.initials ?? '?'" size="xlarge" shape="circle" class="profile-avatar" aria-hidden="true"/>
        <h2 id="caregiver-title" class="text-xl mt-2">{{ shownProfile?.fullName ?? $t('common.loading') }}</h2>
        <p class="m-0 text-600">{{ shownProfile?.professionalTitle || $t('profiles.caregiver.no-title') }}</p>
        <p v-if="shownProfile?.phoneNumber" class="m-0 text-sm"><i class="pi pi-phone mr-1" aria-hidden="true"/>{{ shownProfile.phoneNumber }}</p>
        <p v-if="shownProfile?.bio" class="m-0 text-sm text-600">{{ shownProfile.bio }}</p>
        <div class="flex flex-wrap justify-content-center gap-1 mt-2">
          <pv-tag v-for="certification in shownProfile?.certifications ?? []" :key="certification" :value="certification"/>
        </div>
      </article>
    </div>

    <div v-if="iamStore.isCaregiver" class="col-12 lg:col-8">
      <form class="vt-card" novalidate @submit.prevent="save">
        <h3 class="text-lg mb-3">{{ $t('profiles.caregiver.edit') }}</h3>
        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="caregiver-first-name">{{ $t('iam.fields.first-name') }} *</label>
            <pv-input-text id="caregiver-first-name" v-model="form.firstName" aria-required="true"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="caregiver-last-name">{{ $t('iam.fields.last-name') }} *</label>
            <pv-input-text id="caregiver-last-name" v-model="form.lastName" aria-required="true"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="professional-title">{{ $t('profiles.fields.professional-title') }}</label>
            <pv-input-text id="professional-title" v-model="form.professionalTitle"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="caregiver-phone">{{ $t('profiles.fields.phone') }}</label>
            <pv-input-text id="caregiver-phone" v-model="form.phoneNumber" inputmode="tel"/>
          </div>
          <div class="col-12 flex flex-column gap-2">
            <label for="bio">{{ $t('profiles.fields.bio') }}</label>
            <pv-textarea id="bio" v-model="form.bio" rows="3" auto-resize/>
          </div>
          <div class="col-12 flex flex-column gap-2">
            <label for="certifications">{{ $t('profiles.fields.certifications') }}</label>
            <tag-list-input v-model="form.certifications" input-id="certifications" :placeholder="$t('profiles.fields.certifications-placeholder')"/>
          </div>
        </div>
        <div aria-live="polite">
          <pv-message v-for="error in store.errors" :key="error" severity="error" class="mb-3">{{ $t(error) }}</pv-message>
        </div>
        <div class="flex justify-content-end">
          <pv-button type="submit" :label="$t('common.save')" icon="pi pi-check"/>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.profile-avatar { background: var(--vt-primary); color: #fff; font-weight: 700; }
label { font-size: 0.875rem; font-weight: 500; }
</style>
