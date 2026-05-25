<script lang="ts">
	type Props = {
		checked: boolean;
		onchange: (v: boolean) => void;
	};
	let { checked, onchange }: Props = $props();
</script>

<label
	class="flex items-start gap-3 p-4 rounded-[var(--radius-soft)] cursor-pointer"
	style:background="var(--color-paper-deep)"
	style:border="1.5px solid var(--color-line)"
>
	<input
		type="checkbox"
		checked={checked}
		onchange={(e) => onchange((e.target as HTMLInputElement).checked)}
		class="mt-1 w-5 h-5 accent-[var(--color-rust)] shrink-0"
	/>
	<span class="text-[0.95rem] leading-relaxed">
		I understand this is an <strong>exploration tool</strong>, not a diagnosis. It cannot
		identify learning disabilities. If anything stands out, I'll talk with her teacher and
		pediatrician — not stop at the quiz.
	</span>
</label>
