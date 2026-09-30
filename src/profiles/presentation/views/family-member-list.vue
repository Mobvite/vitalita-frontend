<script setup>
import {onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../../../../../vitalita-frontend/src/profiles/application/profiles.store.js";
import useCareContextStore from "../../../../../../vitalita-frontend/src/shared/application/care-context.store.js";
import InviteFamilyDialog from "../../../../../../vitalita-frontend/src/profiles/presentation/components/invite-family-dialog.vue";

const {t} = useI18n();
const confirm = useConfirm();
const iamStore = useIamStore();
const store = useProfilesStore();
const careContext = useCareContextStore();
const inviteVisible = ref(false);

const statusSeverity = {Active: 'success', Pending: 'warn', Revoked: 'danger'};

async function load() {
  await store.initialize(iamStore.currentUserId, iamStore.isCaregiver);
  if (careContext.selectedOlderAdultId) await store.fetchFamilyAccesses(careContext.selectedOlderAdultId);
}

function confirmRevoke(access) {
  confirm.require({
    header: t('profiles.family.revoke-header'),
    message: t('profiles.family.revoke-message', {name: store.getFamilyMemberName(access.familyMemberId) || access.invitedEmail}),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {label: t('common.cancel'), severity: 'secondary', text: true},
    acceptProps: {label: t('profiles.family.revoke'), severity: 'danger'},
    accept: () => store.revokeFamilyAccess(access)
  });
}

onMounted(load);
watch(() => careContext.selectedOlderAdultId, load);
</script>

<template>
  <section aria-labelledby="family-title">
    <div class="flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h2 id="family-title" class="vt-page-title">{{ $t('profiles.family.title') }}</h2>
        <p class="vt-page-subtitle">{{ $t('profiles.family.subtitle', {name: store.selectedOlderAdult?.fullName ?? ''}) }}</p>
      </div>
      <pv-button v-if="iamStore.isCaregiver" :label="$t('profiles.invite.open')" icon="pi pi-user-plus"
                 :disabled="!store.selectedOlderAdult" @click="inviteVisible = true"/>
    </div>

    <div class="vt-card">
      <pv-data-table :value="store.familyAccesses" :loading="store.isLoading" data-key="id"
                     :aria-label="$t('profiles.family.title')" responsive-layout="stack" breakpoint="768px">
        <template #empty>{{ $t('profiles.family.empty') }}</template>
        <pv-column :header="$t('profiles.family.name')">
          <template #body="{data}">
            <p class="m-0 font-semibold">{{ store.getFamilyMemberName(data.familyMemberId) || $t('profiles.family.pending-name') }}</p>
            <p class="m-0 text-sm text-600">{{ data.invitedEmail }}</p>
          </template>
        </pv-column>
        <pv-column :header="$t('profiles.family.relationship')">
          <template #body="{data}">{{ $t(`profiles.relationships.${data.relationship}`) }}</template>
        </pv-column>
        <pv-column :header="$t('profiles.family.status')">
          <template #body="{data}">
            <pv-tag :severity="data.isPending() && data.isExpired() ? 'secondary' : statusSeverity[data.status]"
                    :value="data.isPending() && data.isExpired() ? $t('profiles.status.Expired') : $t(`profiles.status.${data.status}`)"/>
          </template>
        </pv-column>
        <pv-column v-if="iamStore.isCaregiver" :header="$t('profiles.family.invitation-code')">
          <template #body="{data}"><span v-if="data.isPending()" class="font-semibold">{{ data.invitationCode }}</span></template>
        </pv-column>
        <pv-column v-if="iamStore.isCaregiver" :header="$t('common.actions')">
          <template #body="{data}">
            <pv-button v-if="data.status !== 'Revoked'" icon="pi pi-ban" text rounded severity="danger"
                       :aria-label="$t('profiles.family.revoke')" v-tooltip.top="$t('profiles.family.revoke')"
                       @click="confirmRevoke(data)"/>
          </template>
        </pv-column>
      </pv-data-table>
      <div aria-live="polite">
        <pv-message v-for="error in store.errors" :key="error" severity="error" class="mt-3">{{ $t(error) }}</pv-message>
      </div>
    </div>

    <p v-if="iamStore.isFamilyMember" class="mt-3 text-sm text-600">{{ $t('profiles.family.read-only') }}</p>
    <invite-family-dialog v-model:visible="inviteVisible"/>
  </section>
</template>
