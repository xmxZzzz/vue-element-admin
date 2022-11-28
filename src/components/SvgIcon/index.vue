<template>
  <!-- 如果是外部链接svg资源 -->
  <div v-if="isExternal" :style="styleExternalIcon" class="svg-external-icon svg-icon" v-on="$listeners" />
  <!--
      内部svg资源
          aria-hidden="true": 对访问设备隐藏
    -->
  <svg v-else :class="svgClass" aria-hidden="true" v-on="$listeners">
    <use :xlink:href="iconName" />
  </svg>
</template>

<script>
// doc: https://panjiachen.github.io/vue-element-admin-site/feature/component/svg-icon.html#usage
import { isExternal } from '@/utils/validate'

export default {
  name: 'SvgIcon',
  props: {
    iconClass: {
      type: String,
      required: true
    },
    className: {
      type: String,
      default: ''
    }
  },
  computed: {
    // 是否是外部链接
    isExternal() {
      return isExternal(this.iconClass)
    },
    // svg图标名称
    iconName() {
      return `#icon-${this.iconClass}`
    },
    // 内部svg：如果有自定义样式，则与svg-icon 拼接，最终样式为：class= 'svg-icon className'
    svgClass() {
      if (this.className) {
        // 'svg-icon '： icon后面有空格
        return 'svg-icon ' + this.className
      } else {
        return 'svg-icon'
      }
    },
    // 外部svg资源样式
    styleExternalIcon() {
      return {
        mask: `url(${this.iconClass}) no-repeat 50% 50%`,
        '-webkit-mask': `url(${this.iconClass}) no-repeat 50% 50%`
      }
    }
  }
}
</script>

<style scoped>
/*iconfont（阿里图标库） 的 symbol引用，要求加入的通用css代码*/
.svg-icon {
  /*将icon大小设置和字体大小一致，后续在通过svg-icon 使用icon的时候，可直接设置图标的font-size即可控制图标大小 */
  width: 1em;
  height: 1em;
  /*
  为何要设置vertical-align: -0.15em?
    因icon大小被设置为和字体大小一致，而span等标签的下边缘会和字体的基线对齐，
    故需设置一个往下的偏移比例，来纠正视觉上的未对齐效果
  */
  vertical-align: -0.15em;
  /* 定义元素的颜色，currentColor是一个变量，这个变量的值就表示当前元素的color值，如果当前元素未设置color值，则从父元素继承 */
  fill: currentColor;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  /*此时会保持图像的纵横比并将图像缩放成将完全覆盖背景定位区域的最小大小。*/
  mask-size: cover!important;
  display: inline-block;
}
</style>
