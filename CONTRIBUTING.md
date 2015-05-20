# Contributing to Minion

Looking to contribute something to Minion? Here's how you can help.

Please take a moment to review this document in order to make the contribution process easy and effective for everyone involved.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue or assessing patches and features.


## Bug reports

A bug is a demonstrable problem that is caused by the code in the repository. Good bug reports are extremely helpful, so thanks!

Guidelines for bug reports:

1. **Use the GitHub issue search** &mdash; check if the issue has not already been reported.

2. **Screenshot the console output** &mdash; this gives us alot of information to help fix the problem.

3. **Describe the situation** &mdash; tell us what you were doing when the problem occured, what you expected to happen and what actually happened.

A good bug report shouldn't leave others needing to chase you up for more information. Please try to be as detailed as possible in your report. What is your environment? What steps will reproduce the issue? What browser(s) and OS experience the problem? Do other browsers show the bug differently? All these details will help people to fix any potential bugs.

Example bug report:

> Short and descriptive example bug report title
>
> A summary of the issue and the browser/OS environment in which it occurs. If
> suitable, include the steps required to reproduce the bug.
>
> 1. This is the first step
> 2. This is the second step
> 3. Further steps, etc.
>
> `<url>` - a link to the uploaded console output image
>
> Any other information you want to share that is relevant to the issue being
> reported. This might include the lines of code that you have identified as
> causing the bug, and potential solutions (and your opinions on their
> merits).


## Feature requests

Feature requests are welcome. But take a moment to find out whether your idea
fits with the scope and aims of the project. It's up to *you* to make a strong
case to convince the project's developers of the merits of this feature. Please
provide as much detail and context as possible.


## Pull requests

Good pull requests (patches, improvements, new features) are a fantastic help. They should remain focused in scope and avoid containing unrelated commits.

**Please ask first** before embarking on any significant pull request (e.g.
implementing features, refactoring code, porting to a different language),
otherwise you risk spending a lot of time working on something that the
project's developers might not want to merge into the project.

Please adhere to the [coding guidelines](#code-guidelines) used throughout the
project (indentation, accurate comments, etc.) and any other requirements
(such as test coverage).

**Do not edit `minion.min.js`**, this is the minified and automatically generated version of the file you *should* edit, `minion.js`.

Adhering to the following process is the best way to get your work included in the project:

1. [Fork](http://help.github.com/fork-a-repo/) the project and clone that fork.
   ```bash
   git clone https://github.com/<your-username>/minion.git
   cd minion
   git remote add upstream https://github.com/lesander/minion.git
   ```

2. If you cloned a while ago, get the latest changes from upstream:
   ```bash
   git checkout master
   git pull upstream master
   ```

3. Create a new topic branch (off the main project development branch) to contain your feature, change, or fix:
   ```bash
   git checkout -b <topic-branch-name>
   ```

4. Commit your changes in logical chunks. Please adhere to these [git commit message guidelines](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) or your code is unlikely be merged into the main project. Use Git's [interactive rebase](https://help.github.com/articles/interactive-rebase) feature to tidy up your commits before making them public.

5. Locally merge (or rebase) the upstream development branch into your topic branch:
   ```bash
   git pull [--rebase] upstream master
   ```

6. Push your topic branch up to your fork:
   ```bash
   git push origin <topic-branch-name>
   ```

7. [Open a Pull Request](https://help.github.com/articles/using-pull-requests/) with a clear title and description against the `master` branch.

**IMPORTANT**: By submitting a patch, you agree to allow the project owners to
license your work under the terms of the [MIT License](LICENSE).


## Code guidelines

We try to code as much as possible to [the Code Guide](http://codeguide.co/) by @mdo, with a few exceptions / additions:
- Always use one tab character for spacing.
- Use Objects instead of tables where possible.


## License

By contributing your code, you agree to license your contribution under [the MIT license](LICENSE).


*This file has been copied from https://github.com/twbs/bootstrap/blob/master/CONTRIBUTING.md and adjusted to Minion's needs.*
