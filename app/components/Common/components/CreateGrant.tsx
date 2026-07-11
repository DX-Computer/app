"use client";

import { FunctionComponent, JSX, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreateGrantProps } from "../types/common.types";
import useCreateGrant from "../hooks/useCreateGrant";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-sm text-white focus:outline-none`;
const tag = "relative flex text-xs text-gray-400";
const mini = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;

const CreateGrant: FunctionComponent<CreateGrantProps> = ({
  onCreate,
  initial,
  editMode,
}): JSX.Element => {
  const f = useCreateGrant(onCreate, initial);
  const params = useSearchParams();
  const s = useShell();
  const kits = s.allItems;
  const [kitQuery, setKitQuery] = useState<string>("");

  const selectedKit = kits.find((k) => k.id === f.kit);
  const matches = kits
    .filter((k) =>
      `${k.id} ${k.title}`
        .toLowerCase()
        .includes(kitQuery.trim().toLowerCase()),
    )
    .slice(0, 6);

  useEffect(() => {
    const k = params.get("kit");
    if (k && k !== f.kit) f.setKit(k);
  }, [params]);

  return (
    <div className="relative w-full flex flex-col gap-3 p-4 text-white">
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createGrant.kitRequired}</span>
        {f.kit ? (
          <div className="relative flex flex-row gap-2 items-center">
            <span className="relative flex text-sm">
              {selectedKit
                ? fmt(s.dict.createGrant.kitSelected, { id: selectedKit.id, title: selectedKit.title })
                : fmt(s.dict.createGrant.kitFallback, { kit: f.kit })}
            </span>
            {!editMode && (
              <button
                onClick={() => {
                  f.setKit("");
                  setKitQuery("");
                }}
                className={mini}
              >
                {s.dict.common.clear}
              </button>
            )}
          </div>
        ) : (
          <>
            <input
              value={kitQuery}
              onChange={(e) => setKitQuery(e.target.value)}
              placeholder={s.dict.createGrant.searchKitsPlaceholder}
              className={inp}
            />
            {kitQuery.trim() && (
              <div className={`relative flex flex-col ${fieldBg}`}>
                {matches.length ? (
                  matches.map((k) => (
                    <button
                      key={k.id}
                      onClick={() => {
                        f.setKit(k.id);
                        setKitQuery("");
                      }}
                      className="relative flex text-left px-2 py-1 text-xs cursor-blacksmithHS"
                    >
                      {fmt(s.dict.createGrant.kitOption, { id: k.id, title: k.title })}
                    </button>
                  ))
                ) : (
                  <span className="relative flex px-2 py-1 text-xs text-gray-500">
                    {s.dict.createGrant.noMatches}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createGrant.titleRequired}</span>
        <input
          value={f.title}
          onChange={(e) => f.setTitle(e.target.value)}
          className={inp}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createGrant.purposeRequired}</span>
        <textarea
          value={f.purpose}
          onChange={(e) => f.setPurpose(e.target.value)}
          rows={3}
          className={`${inp} resize-none`}
        />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createGrant.imageUriRequired}</span>
        <input
          value={f.image}
          onChange={(e) => f.setImage(e.target.value)}
          placeholder={s.dict.createGrant.imageUriPlaceholder}
          className={inp}
        />
      </div>

      <div className="relative flex flex-row gap-2">
        <div className="relative flex flex-col flex-1 gap-1">
          <span className={tag}>{s.dict.createGrant.budgetRequired}</span>
          <input
            value={f.budget}
            onChange={(e) => f.setBudget(e.target.value)}
            placeholder={s.dict.createGrant.budgetPlaceholder}
            className={inp}
          />
        </div>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createGrant.deliverablesRequired}</span>
        <textarea
          value={f.deliverables}
          onChange={(e) => f.setDeliverables(e.target.value)}
          rows={3}
          placeholder={s.dict.createGrant.deliverablesPlaceholder}
          className={`${inp} resize-none`}
        />
      </div>

      <div className="relative flex flex-col gap-2">
        <span className={tag}>{s.dict.createGrant.milestonesRequired}</span>
        {f.milestones.map((m, i) => (
          <div
            key={i}
            className={`relative flex flex-col gap-1 ${fieldBg} p-2`}
          >
            <div className="relative flex flex-row items-center gap-2">
              <span className="relative flex flex-1 text-[10px] text-gray-400">
                {fmt(s.dict.createGrant.milestoneLabel, { index: i + 1 })}
              </span>
              {f.milestones.length > 3 && (
                <button
                  onClick={() => f.removeMilestone(i)}
                  aria-label={s.dict.common.remove}
                  className="relative flex text-gray-400 cursor-blacksmithHS"
                >
                  ✕
                </button>
              )}
            </div>
            <input
              value={m.title}
              onChange={(e) => f.setMilestone(i, "title", e.target.value)}
              placeholder={s.dict.createGrant.milestoneTitlePlaceholder}
              className={inp}
            />
            <textarea
              value={m.description}
              onChange={(e) => f.setMilestone(i, "description", e.target.value)}
              rows={2}
              placeholder={s.dict.createGrant.milestoneDescriptionPlaceholder}
              className={`${inp} resize-none`}
            />
            <input
              value={m.deliverable}
              onChange={(e) => f.setMilestone(i, "deliverable", e.target.value)}
              placeholder={s.dict.createGrant.milestoneDeliverablePlaceholder}
              className={inp}
            />
          </div>
        ))}
        <button onClick={f.addMilestone} className={mini}>
          {s.dict.createGrant.addMilestone}
        </button>
      </div>

      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createGrant.linksOptional}</span>
        <div className="relative flex flex-row gap-2 items-center">
          <input
            value={f.linkInput}
            onChange={(e) => f.setLinkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                f.addLink();
              }
            }}
            placeholder={s.dict.createGrant.linkPlaceholder}
            className={`${inp} flex-1`}
          />
          <button onClick={f.addLink} className={mini}>
            {s.dict.common.add}
          </button>
        </div>
        {f.links.length > 0 && (
          <div className="relative flex flex-row flex-wrap gap-1">
            {f.links.map((l, i) => (
              <span
                key={i}
                className={`relative inline-flex flex-row items-center gap-1 ${fieldBg} px-2 py-0.5 text-xs`}
              >
                {l}
                <button
                  onClick={() => f.removeLink(i)}
                  aria-label={s.dict.common.remove}
                  className="relative flex text-gray-400"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex flex-row gap-2 items-center">
        <span className={tag}>{s.dict.common.license}</span>
        <span className="relative flex text-xs">{s.dict.common.cc0}</span>
      </div>

      <div className="relative flex flex-row gap-2 items-center flex-wrap">
        <button
          onClick={f.build}
          disabled={!f.canSubmit}
          className={`relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm ${
            f.canSubmit ? "" : "opacity-40 text-gray-400"
          }`}
        >
          {s.dict.createGrant.packageContent}
        </button>
        <button onClick={f.reset} className={mini}>
          {s.dict.common.clear}
        </button>
      </div>
    </div>
  );
};

export default CreateGrant;
