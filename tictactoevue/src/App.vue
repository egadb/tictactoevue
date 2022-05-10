<template>

  <Authenticator variation="modal">
    <template v-slot="{ user, signOut }">
      <h1>Hello {{ user.attributes.email }}!</h1>
      <button @click="signOut">Sign Out</button>
      <Board/>
    </template>
  </Authenticator>

</template>




<script>
import Board from './components/Board.vue'
import { Authenticator } from '@aws-amplify/ui-vue';
import '@aws-amplify/ui-vue/styles.css';

export default { 
  name: 'App',
  components: {Board,Authenticator}
}
</script>

<style >
#App{
}
</style>

