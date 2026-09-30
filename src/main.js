import { createApp } from 'vue'
import '../../../../../Downloads/vitalita-frontend/src/style.css'
import App from '../../../../../Downloads/vitalita-frontend/src/app.vue'
import i18n from "./i18n.js";
import PrimeVue from 'primevue/config';
import VitalitaTheme from "./theme.js";
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Checkbox,
    Column,
    ConfirmationService,
    ConfirmDialog,
    DataTable,
    DatePicker,
    Dialog,
    Divider,
    Drawer,
    FileUpload,
    FloatLabel,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Menu,
    Message,
    Paginator,
    Password,
    ProgressSpinner,
    Select,
    SelectButton,
    Skeleton,
    Tag,
    Textarea,
    Toast,
    ToastService,
    Toolbar
} from "primevue";
import router from "./router.js";
import pinia from "./pinia.js";

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

// Pinia is installed before the router, because the navigation guard reads the IAM store.
// noinspection JSCheckFunctionSignatures
createApp(App)
    .use(i18n)
    .use(PrimeVue, {theme: {preset: VitalitaTheme, options: {darkModeSelector: false}}, ripple: true, license: primeUiLicenseKey})
    .use(ConfirmationService)
    .use(ToastService)
    .component('pv-avatar',           Avatar)
    .component('pv-badge',            Badge)
    .component('pv-button',           Button)
    .component('pv-card',             Card)
    .component('pv-checkbox',         Checkbox)
    .component('pv-column',           Column)
    .component('pv-confirm-dialog',   ConfirmDialog)
    .component('pv-data-table',       DataTable)
    .component('pv-date-picker',      DatePicker)
    .component('pv-dialog',           Dialog)
    .component('pv-divider',          Divider)
    .component('pv-drawer',           Drawer)
    .component('pv-file-upload',      FileUpload)
    .component('pv-float-label',      FloatLabel)
    .component('pv-icon-field',       IconField)
    .component('pv-input-icon',       InputIcon)
    .component('pv-input-number',     InputNumber)
    .component('pv-input-text',       InputText)
    .component('pv-menu',             Menu)
    .component('pv-message',          Message)
    .component('pv-paginator',        Paginator)
    .component('pv-password',         Password)
    .component('pv-progress-spinner', ProgressSpinner)
    .component('pv-select',           Select)
    .component('pv-select-button',    SelectButton)
    .component('pv-skeleton',         Skeleton)
    .component('pv-tag',              Tag)
    .component('pv-textarea',         Textarea)
    .component('pv-toast',            Toast)
    .component('pv-toolbar',          Toolbar)
    .directive('tooltip',             Tooltip)
    .use(pinia)
    .use(router)
    .mount('#app')
