# SafePush V1

This action commits files and safe-pushes them to a selected branch of a target repository.

In case of branch changes during the action execution it will try to pull the changes from the remote repo before reattempting to push the commit, 3 times.

If there are no changes to be commited, the action will exit with code 0.

# Usage

<!-- start usage -->
```yaml
- uses: actions/safepush@v1
  with:
    # User who is pushing the changes
    # Required: true
    user-name:

    # Email of the user who is pushing the changes
    # Required: true
    user-email:

    # Github Token to push to the repository
    # Required: true
    repo-token:

    # Branch to where to push the changes to
    # Required: false
    # Default: main
    branch:

    # Commit message
    # Required: false
    commit-message:

    # Repository to push to (can be org/repo-name or just repo-name)
    # Required: true
    repository:

    # Owner of the repository (specify only if repository name does not incluse the owner)
    # Required: false
    owner:

    # Path to the files to push
    # Required: false
    # Default: .
    path:

    # Version to include in commit message
    # Required: false
    version:
```
<!-- end usage -->
