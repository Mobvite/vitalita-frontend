<script setup>
import {computed, onMounted, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../application/profiles.store.js";
import useCareContextStore from "../../../shared/application/care-context.store.js";
import {CaregiverProfile} from "../../domain/model/caregiver-profile.entity.js";
import {FamilyMemberProfile} from "../../domain/model/family-member-profile.entity.js";
import TagListInput from "../components/tag-list-input.vue";

const {t} = useI18n();
const toast = useToast();
const iamStore = useIamStore();
const store = useProfilesStore();
const careContext = useCareContextStore();

const form = reactive({firstName: '', lastName: '', phoneNumber: '', professionalTitle: '', bio: '', certifications: []});
/** Own data of a family member, shown next to the profile of the caregiver in charge. */
const familyForm = reactive({firstName: '', lastName: '', phoneNumber: ''});
const shownProfile = computed(() => iamStore.isCaregiver ? store.caregiverProfile : store.responsibleCaregiver);

function fillForm() {
  if (!store.caregiverProfile) return;
  const {firstName, lastName, phoneNumber, professionalTitle, bio, certifications} = store.caregiverProfile;
  Object.assign(form, {firstName, lastName, phoneNumber, professionalTitle, bio, certifications: [...certifications]});
}

async function load() {
  await store.initialize(iamStore.currentUserId, iamStore.isCaregiver);
  profileLoaded.value = store.errors.length === 0;
  if (iamStore.isCaregiver) fillForm();
  else {
    fillFamilyForm();
    await store.fetchResponsibleCaregiver();
  }
}

function fillFamilyForm() {
  if (!store.familyMemberProfile) return;
  const {firstName, lastName, phoneNumber} = store.familyMemberProfile;
  Object.assign(familyForm, {firstName, lastName, phoneNumber});
}

async function saveFamilyMember() {
  const updated = new FamilyMemberProfile({...store.familyMemberProfile, ...familyForm});
  if (await store.updateFamilyMemberProfile(updated)) {
    toast.add({severity: 'success', summary: t('profiles.family-member.saved'), life: 3000});
  }
}

/** True when the account was created but the profile step did not finish. */
const profileLoaded = ref(false);
const isProfileMissing = computed(() => profileLoaded.value && iamStore.isCaregiver && !store.caregiverProfile);

async function save() {
  const saved = isProfileMissing.value
    ? await store.createCaregiverProfile({...form, userId: iamStore.currentUserId})
    : await store.updateCaregiverProfile(new CaregiverProfile({...store.caregiverProfile, ...form}));
  if (saved) {
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
        <pv-message v-if="isProfileMissing" severity="warn" class="mb-3">{{ $t('profiles.caregiver.complete-profile') }}</pv-message>
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

    <div v-else-if="store.familyMemberProfile" class="col-12 lg:col-8">
      <form class="vt-card" novalidate aria-labelledby="family-member-title" @submit.prevent="saveFamilyMember">
        <h3 id="family-member-title" class="text-lg mb-3">{{ $t('profiles.family-member.edit') }}</h3>
        <div class="grid">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="family-member-first-name">{{ $t('iam.fields.first-name') }} *</label>
            <pv-input-text id="family-member-first-name" v-model="familyForm.firstName" autocomplete="given-name" aria-required="true"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="family-member-last-name">{{ $t('iam.fields.last-name') }} *</label>
            <pv-input-text id="family-member-last-name" v-model="familyForm.lastName" autocomplete="family-name" aria-required="true"/>
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label for="family-member-phone">{{ $t('profiles.fields.phone') }}</label>
            <pv-input-text id="family-member-phone" v-model="familyForm.phoneNumber" inputmode="tel" autocomplete="tel"/>
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
