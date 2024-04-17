function groupBy(list, keyGetter) {
  const map = new Map();
  list.forEach((item, i) => {
    const key = keyGetter(item, i);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

async function run() {
  // @type {any}	
  const issuesAll = Array.from(
    document.querySelectorAll(".issue-link[data-hovercard-type=issue]")
  );
  const issues = Array.from(new Set(issuesAll.map((el) => el.href)));
  const contents = await Promise.all(
    issues.map((url) => fetch(url).then((r) => r.text()))
  );
  const domParser = new DOMParser();
  const docs = contents.map((content) =>
    domParser.parseFromString(content, "text/html")
  );
  const milestones = docs.map(
    (doc) =>
      doc.querySelectorAll('[aria-label="Select milestones"] a strong')[0]
        ?.innerText
  );
  const titles = docs.map((doc) => doc.title);
  const names = titles.map((title) => title.split(" · ")[0]);
  const prefixes = names.map((str) => /\[([^\]]+)\]/.exec(str)?.[1]);
  const mdLines = names.map((name, i) => `* [${name}](${issues[i]})`);
  const milestoneNames = Array.from(
    new Set(milestones.filter((str) => Boolean(str)))
  );
  console.log(mdLines.join("\n"));
  const groups = Array.from(
    groupBy(mdLines, (_, i) => milestones[i] || prefixes[i]).entries()
  ).map(([g, name]) => [g || "", name]);
  groups.sort(([a], [b]) => a.localeCompare(b));
  groups.sort(
    ([a], [b]) =>
      (milestoneNames.includes(b) ? 100 : 0) -
      (milestoneNames.includes(a) ? 100 : 0)
  );
  const grouped = groups
    .map(([group, lines]) => `### ${group}\n${lines.join("\n")}\n`)
    .join("\n");
  console.log(grouped);
}

run();
