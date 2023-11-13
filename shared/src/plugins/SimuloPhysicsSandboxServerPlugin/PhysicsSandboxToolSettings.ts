interface PhysicsSandboxToolSetting {
    type: "slider" | "checkbox" | "list";
    label: string;
    id: string;
}

interface PhysicsSandboxToolSettingSlider extends PhysicsSandboxToolSetting {
    type: "slider";
    min: number;
    max: number;
    step: number;
    value: number;
}

interface PhysicsSandboxToolSettingCheckbox extends PhysicsSandboxToolSetting {
    type: "checkbox";
    value: boolean;
}

interface PhysicsSandboxToolSettingList extends PhysicsSandboxToolSetting {
    type: "list";
    options: {
        label: string;
        image?: string;
    }[];
    value: string;
}

export type PhysicsSandboxToolSettings = (PhysicsSandboxToolSettingSlider | PhysicsSandboxToolSettingCheckbox | PhysicsSandboxToolSettingList)[];
export default PhysicsSandboxToolSettings;
export { PhysicsSandboxToolSetting, PhysicsSandboxToolSettingSlider, PhysicsSandboxToolSettingCheckbox, PhysicsSandboxToolSettingList };