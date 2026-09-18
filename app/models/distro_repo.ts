import { DistroRepoSchema } from '#database/schema'

/**
 * A repository serving a release. The link carries nothing of its own — the repositories of a
 * release are read through it rather than from it — but the chain a release is reached by runs
 * distribution → link → repository → package, and a relation can only be named over a model.
 */
export default class DistroRepo extends DistroRepoSchema {}
