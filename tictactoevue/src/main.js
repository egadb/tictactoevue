import { createApp } from 'vue'
import App from './App.vue'
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import '@aws-amplify/ui-vue/styles.css'
Amplify.configure(awsExports);

createApp(App).mount('#app')
