"use client";
import { useEffect, useRef } from "react";
import FormComponent from "@/lib/components/form-component";
import {
 ButtonSubmitFunnel,
 ContainerFormFunnel,
 useFunnel,
} from "./funnel.provider";

export default function Step1() {
 const { user, inputs, setInputs, handleOnChange } = useFunnel();
 const nameRef = useRef<HTMLInputElement>(null);
 const surnameRef = useRef<HTMLInputElement>(null);
 const professionRef = useRef<HTMLInputElement>(null);
 const shortBioRef = useRef<HTMLTextAreaElement>(null);

 useEffect(() => {
 setInputs(
 nameRef?.current,
 surnameRef?.current,
 professionRef?.current,
 shortBioRef?.current,
 );
 }, [setInputs]);
 return (
 <ContainerFormFunnel>
 <FormComponent.LabelInput
 ref={nameRef}
 label="First Name"
 type="text"
 id="name"
 name="name"
 defaultValue={
 inputs?.name || (user as { name?: string })?.name || undefined
 }
 placeholder="Leonardo"
 autoComplete="given-name"
 required
 autoFocus
 onChange={handleOnChange}
 />

 {/* Surname Field */}
 <FormComponent.LabelInput
 ref={surnameRef}
 label="Last Name"
 type="text"
 id="surname"
 name="surname"
 defaultValue={
 inputs?.surname ||
 (user as { surname?: string })?.surname ||
 undefined
 }
 placeholder="Piero da Vinci"
 autoComplete="family-name"
 required
 onChange={handleOnChange}
 />
 {/* Profession Field */}
 <FormComponent.LabelInput
 ref={professionRef}
 label="Profession"
 type="text"
 id="profession"
 name="profession"
 max={100}
 defaultValue={
 inputs?.profession || (user as any)?.profession || undefined
 }
 placeholder="Renaissance polymath & professional dreamer"
 autoComplete="organization-title"
 onChange={handleOnChange}
 />

 {/* Description Field */}
 <FormComponent.LabelTextarea
 ref={shortBioRef}
 label="Short bio about you"
 id="short_biography"
 name="short_biography"
 defaultValue={
 inputs?.short_biography || (user as any)?.short_biography || undefined
 }
 placeholder="I sketch flying machines at breakfast and dissect curiosity for a living..."
 rows={4}
 onChange={handleOnChange}
 />
 <div>
 <ButtonSubmitFunnel />
 </div>
 </ContainerFormFunnel>
 );
}
