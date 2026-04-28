import { createSignal, Show } from "solid-js";

type SocialActionFormProps = {
  title: string;
  placeholder: string;
  buttonLabel: string;
  helpText: string;
  successText: string | null;
  errorText: string | null;
  onSubmit: (value: string) => Promise<void>;
};

export default function SocialActionForm(props: SocialActionFormProps) {
  const [value, setValue] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const nextValue = value().trim();
    if (!nextValue || isSubmitting()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await props.onSubmit(nextValue);
      setValue("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form class="social-action-form" onSubmit={handleSubmit}>
      <label>
        <span class="social-form-title">{props.title}</span>
        <input
          class="social-form-input"
          type="text"
          placeholder={props.placeholder}
          value={value()}
          onInput={(event) => setValue(event.currentTarget.value)}
        />
      </label>

      <button class="social-card-action" type="submit" disabled={isSubmitting() || !value().trim()}>
        {isSubmitting() ? "Working..." : props.buttonLabel}
      </button>

      <p class="social-form-help">{props.helpText}</p>
      <Show when={props.successText}>
        <p class="social-form-success">{props.successText}</p>
      </Show>
      <Show when={props.errorText}>
        <p class="social-form-error">{props.errorText}</p>
      </Show>
    </form>
  );
}
