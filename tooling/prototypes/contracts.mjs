import path from "node:path";

export function isRepositoryPath(root, relativePath) {
  const absoluteRoot = path.resolve(root);
  const absolutePath = path.resolve(absoluteRoot, relativePath);
  return absolutePath.startsWith(`${absoluteRoot}${path.sep}`);
}

export function routeMatchesSource(routePath, source) {
  const match = /^apps\/[^/]+\/app(?:\/(.*))?\/page\.(?:js|jsx|ts|tsx)$/.exec(source);
  if (!match) return false;
  const expectedPath = match[1] ? `/${match[1]}` : "/";
  try {
    return new URL(routePath, "http://yami.local").pathname === expectedPath;
  } catch {
    return false;
  }
}
