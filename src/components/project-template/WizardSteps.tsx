interface WizardStepsProps {
  currentStep: number;
}

const steps = [
  {
    number: 1,
    title: "Template",
    description: "Template details",
  },
  {
    number: 2,
    title: "Folders",
    description: "Folders & subfolders",
  },
  {
    number: 3,
    title: "Roles",
    description: "Role allocation",
  },
];

function WizardSteps({ currentStep }: WizardStepsProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep === step.number
                  ? "bg-blue-600 text-white"
                  : currentStep > step.number
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {currentStep > step.number ? "✓" : step.number}
            </div>

            <div className="mt-2 text-center">
              <p className="font-medium text-sm">{step.title}</p>
              <p className="text-xs text-gray-500">
                {step.description}
              </p>
            </div>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`w-24 h-1 mx-4 ${
                currentStep > step.number
                  ? "bg-green-600"
                  : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default WizardSteps;