<template>
  <div>
    {{ msg }} + {{ count }}
    <button @click="onClick">
      test
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const msg = ref('test');
const count = ref(2);
const onClick = () => {
  count.value += 1;
}
</script>
