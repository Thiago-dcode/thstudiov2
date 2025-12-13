'use client'
import FormComponent from "@/components/form-component";
import { ButtonSubmitFunnel, ContainerFormFunnel, useFunnel } from "./funnel.provider";
import { useEffect, useRef } from "react";

export default function Step1() {

    const { user, inputs, setInputs, handleOnChange } = useFunnel();
    const nameRef = useRef<HTMLInputElement>(null);
    const surnameRef = useRef<HTMLInputElement>(null);
    const shortBioRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setInputs(nameRef?.current, surnameRef?.current, shortBioRef?.current);
    }, [])
    return <ContainerFormFunnel>
        <FormComponent.LabelInput
            ref={nameRef}
            label="First Name"
            type="text"
            id="name"
            name="name"
            defaultValue={inputs?.name || user?.name || undefined}
            placeholder="Enter your first name"
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
            defaultValue={inputs?.surname || user?.surname || undefined}
            placeholder="Enter your last name"
            autoComplete="family-name"
            required
            onChange={handleOnChange}
        />

        {/* Description Field */}
        <FormComponent.LabelTextarea
            ref={shortBioRef}
            label="About You"
            id="short_biography"
            name="short_biography"
            defaultValue={inputs?.short_biography || user?.short_biography || undefined}
            placeholder="Write a short description about yourself..."
            rows={4}
            onChange={handleOnChange}
        />
        <div>
            <ButtonSubmitFunnel />
        </div>
    </ContainerFormFunnel>


}