import React, { createContext, useContext } from "react";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export type SignUpFormValues = {
  email: string;
  password: string;
};

const schema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 88 characters"),
});

const SignUpFormContext = createContext<UseFormReturn<SignUpFormValues> | null>(
  null,
);

export const SignUpFormProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const methods = useForm<SignUpFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  return (
    <SignUpFormContext.Provider value={methods}>
      <FormProvider {...methods}>{children}</FormProvider>
    </SignUpFormContext.Provider>
  );
};

export const useSignUpForm = () => {
  const context = useContext(SignUpFormContext);
  if (!context)
    throw new Error("useSignUpForm must be used within SignUpFormProvider");
  return context;
};
