/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "pinescript-project",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Nextjs("MyWeb", {
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
        TABLE_NAME: process.env.TABLE_NAME || ""
      }
    });
  },
});
