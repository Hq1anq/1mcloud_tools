export default {
  tabWidth: 4,
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: ["*.ejs"],
      options: {
        parser: "html",
      },
    },
  ],
};