/**
 * Re-exports the shared contract from /common/types so the rest of the
 * frontend imports from a stable local path. The single source of truth
 * remains ../../../common/types/delivery.ts — do not redefine types here.
 */
export * from '../../../common/types/delivery';
