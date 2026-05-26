// Re-export the telemetry helpers from the shared package. The original
// implementation now lives in `profile-schema`. This shim exists so
// existing imports (`from '$lib/profile/telemetry'`) keep working without
// touching every callsite.
export {
	readTelemetry,
	totalLaunches,
	followRate,
	modesBy,
	prettyMode,
	decodeProfileFragment,
	type ModuleTelemetry,
	type ModuleRow
} from 'profile-schema';
