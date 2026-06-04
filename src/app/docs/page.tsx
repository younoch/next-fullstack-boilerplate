"use client";

import React, { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-5 text-center">Loading Swagger Specs...</div>;

  return (
    <div className="bg-white min-h-screen">
      <SwaggerUI url="/api/docs/swagger.json" />
    </div>
  );
}