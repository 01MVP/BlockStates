/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './client/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './client/components/**/*.{js,ts,jsx,tsx,mdx}',
    './client/app/**/*.{js,ts,jsx,tsx,mdx}',
    './ui-design-system.html',
    './ui-design-system-simplified.html',
  ],
  theme: {
    extend: {
      // 主色调 - 灰度系统
      colors: {
        // 背景色
        'bg-light': '#FAFAFA',
        'bg-main': '#F0F0F0',

        // 边框和分割线
        'border-subtle': '#E0E0E0',
        'border-main': '#D0D0D0',
        'border-strong': '#B0B0B0',

        // 文字颜色
        'text-primary': '#2A2A2A',
        'text-secondary': '#3A3A3A',
        'text-muted': '#5A5A5A',
        'text-placeholder': '#8A8A8A',
        'text-disabled': '#9A9A9A',

        // 玩家颜色系统（8个玩家）
        player: {
          1: { DEFAULT: '#E74C3C', dark: '#C0392B' },
          2: { DEFAULT: '#3498DB', dark: '#2980B9' },
          3: { DEFAULT: '#2ECC71', dark: '#27AE60' },
          4: { DEFAULT: '#F39C12', dark: '#E67E22' },
          5: { DEFAULT: '#9B59B6', dark: '#8E44AD' },
          6: { DEFAULT: '#1ABC9C', dark: '#16A085' },
          7: { DEFAULT: '#E91E63', dark: '#C2185B' },
          8: { DEFAULT: '#FF5722', dark: '#E64A19' },
        },

        // 地形颜色
        terrain: {
          mountain: { DEFAULT: '#5A5A5A', dark: '#3A3A3A' },
          swamp: { DEFAULT: '#7A7A7A', dark: '#5A5A5A' },
          obstacle: '#4A4A4A',
        },
      },

      // 间距系统
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '30px',
        '2xl': '40px',
      },

      // 圆角系统
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },

      // 边框宽度
      borderWidth: {
        'thin': '1px',
        'normal': '1.5px',
        'thick': '2px',
        'bold': '2.5px',
      },

      // 阴影系统
      boxShadow: {
        'sm': '0 2px 6px rgba(0, 0, 0, 0.06)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'xl': '0 6px 16px rgba(0, 0, 0, 0.12)',
      },

      // 字体系统
      fontFamily: {
        sans: ['"Nunito"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },

      fontSize: {
        'xs': '0.75em',    // 12px
        'sm': '0.85em',    // 13.6px
        'base': '1em',     // 16px
        'lg': '1.1em',     // 17.6px
        'xl': '1.3em',     // 20.8px
        '2xl': '1.8em',    // 28.8px
        '3xl': '2.5em',    // 40px
      },

      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        bold: '700',
      },

      // 过渡动画
      transitionDuration: {
        'fast': '150ms',
        'base': '300ms',
        'slow': '500ms',
      },

      // Z-index层级
      zIndex: {
        'base': '1',
        'dropdown': '10',
        'sticky': '20',
        'modal': '100',
        'tooltip': '200',
      },

      // 背景渐变
      backgroundImage: {
        'gradient-bg': 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
        'gradient-card': 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
        'gradient-btn': 'linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%)',
      },
    },
  },
  plugins: [],
}
