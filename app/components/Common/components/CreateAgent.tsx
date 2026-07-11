"use client";

import { FunctionComponent, JSX, useState } from "react";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { AgentListKey, CreateAgentProps } from "../types/common.types";
import useCreateAgent from "../hooks/useCreateAgent";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-sm text-white focus:outline-none`;
const tag = "relative flex text-xs text-gray-400";
const mini = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;

const CreateAgent: FunctionComponent<CreateAgentProps> = ({
  onCreate,
  initial,
}): JSX.Element => {
  const s = useShell();
  const f = useCreateAgent(onCreate, initial);
  const kits = s.allItems;
  const [kitQuery, setKitQuery] = useState<string>("");

  const kitMatches = kits
    .filter((k) => !f.kits.includes(k.id))
    .filter((k) =>
      `${k.id} ${k.title}`.toLowerCase().includes(kitQuery.trim().toLowerCase()),
    )
    .slice(0, 6);
  const kitTitle = (id: string): string =>
    kits.find((k) => k.id === id)?.title ?? "";

  const chipList = (key: AgentListKey, label: string): JSX.Element => (
    <div className="relative flex flex-col gap-1">
      <span className={tag}>{label}</span>
      <div className="relative flex flex-row gap-2 items-center">
        <input
          value={f.inputs[key]}
          onChange={(e) => f.setInput(key, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              f.addChip(key);
            }
          }}
          placeholder={s.dict.createAgent.addPlaceholder}
          className={`${inp} flex-1`}
        />
        <button onClick={() => f.addChip(key)} className={mini}>
          {s.dict.common.add}
        </button>
      </div>
      {f.lists[key].length > 0 && (
        <div className="relative flex flex-row flex-wrap gap-1">
          {f.lists[key].map((item, i) => (
            <span
              key={i}
              className={`relative inline-flex flex-row items-center gap-1 ${fieldBg} px-2 py-0.5 text-xs`}
            >
              {item}
              <button
                onClick={() => f.removeChip(key, i)}
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
  );

  return (
    <div className="relative w-full flex flex-col gap-3 p-4 text-white">
      <span className="relative flex text-sm">{s.dict.createAgent.identity}</span>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.name}</span>
        <input
          value={f.name}
          onChange={(e) => f.setName(e.target.value)}
          className={inp}
        />
      </div>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.description}</span>
        <textarea
          value={f.description}
          onChange={(e) => f.setDescription(e.target.value)}
          rows={3}
          className={`${inp} resize-none`}
        />
      </div>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.imageUri}</span>
        <input
          value={f.image}
          onChange={(e) => f.setImage(e.target.value)}
          placeholder={s.dict.createAgent.imageUriPlaceholder}
          className={inp}
        />
      </div>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.kitsServedRequired}</span>
        {f.kits.length > 0 && (
          <div className="relative flex flex-row flex-wrap gap-1">
            {f.kits.map((id) => (
              <span
                key={id}
                className={`relative inline-flex flex-row items-center gap-1 ${fieldBg} px-2 py-0.5 text-xs`}
              >
                {fmt(s.dict.createAgent.kitOption, { id, title: kitTitle(id) })}
                <button
                  onClick={() => f.removeKit(id)}
                  aria-label={s.dict.common.remove}
                  className="relative flex text-gray-400"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          value={kitQuery}
          onChange={(e) => setKitQuery(e.target.value)}
          placeholder={s.dict.createAgent.kitsSearchPlaceholder}
          className={inp}
        />
        {kitQuery.trim() && (
          <div className={`relative flex flex-col ${fieldBg}`}>
            {kitMatches.length ? (
              kitMatches.map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    f.addKit(k.id);
                    setKitQuery("");
                  }}
                  className="relative flex text-left px-2 py-1 text-xs cursor-blacksmithHS"
                >
                  {fmt(s.dict.createAgent.kitOption, { id: k.id, title: k.title })}
                </button>
              ))
            ) : (
              <span className="relative flex px-2 py-1 text-xs text-gray-500">
                {s.dict.createAgent.noKitMatches}
              </span>
            )}
          </div>
        )}
      </div>

      {chipList("tags", s.dict.createAgent.tags)}
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.videoUri}</span>
        <input
          value={f.video}
          onChange={(e) => f.setVideo(e.target.value)}
          className={inp}
        />
      </div>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.audioUri}</span>
        <input
          value={f.audio}
          onChange={(e) => f.setAudio(e.target.value)}
          className={inp}
        />
      </div>

      <span className="relative flex text-sm">{s.dict.createAgent.modelReproducible}</span>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.architecture}</span>
        <textarea
          value={f.architecture}
          onChange={(e) => f.setArchitecture(e.target.value)}
          rows={3}
          placeholder={s.dict.createAgent.architecturePlaceholder}
          className={`${inp} resize-none`}
        />
      </div>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.weightsUri}</span>
        <input
          value={f.weights}
          onChange={(e) => f.setWeights(e.target.value)}
          className={inp}
        />
      </div>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.codeRepoUri}</span>
        <input
          value={f.code}
          onChange={(e) => f.setCode(e.target.value)}
          className={inp}
        />
      </div>
      {chipList("datasets", s.dict.createAgent.datasets)}
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.trainingConfig}</span>
        <textarea
          value={f.training}
          onChange={(e) => f.setTraining(e.target.value)}
          rows={2}
          className={`${inp} resize-none`}
        />
      </div>
      {chipList("software", s.dict.createAgent.softwareDeps)}
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.reproduceSteps}</span>
        <textarea
          value={f.reproduce}
          onChange={(e) => f.setReproduce(e.target.value)}
          rows={3}
          placeholder={s.dict.createAgent.reproducePlaceholder}
          className={`${inp} resize-none`}
        />
      </div>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.ioInterface}</span>
        <textarea
          value={f.io}
          onChange={(e) => f.setIo(e.target.value)}
          rows={2}
          placeholder={s.dict.createAgent.ioPlaceholder}
          className={`${inp} resize-none`}
        />
      </div>
      <div className="relative flex flex-row gap-2 items-center">
        <span className={tag}>{s.dict.createAgent.license}</span>
        <span className="relative flex text-xs">{s.dict.common.cc0}</span>
      </div>

      <span className="relative flex text-sm">{s.dict.createAgent.hardwareReproducible}</span>
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.hardwareSpec}</span>
        <textarea
          value={f.hwSpec}
          onChange={(e) => f.setHwSpec(e.target.value)}
          rows={2}
          placeholder={s.dict.createAgent.hardwareSpecPlaceholder}
          className={`${inp} resize-none`}
        />
      </div>
      {chipList("bom", s.dict.createAgent.bomComponents)}
      <div className="relative flex flex-col gap-1">
        <span className={tag}>{s.dict.createAgent.assemblyBuild}</span>
        <textarea
          value={f.assembly}
          onChange={(e) => f.setAssembly(e.target.value)}
          rows={2}
          className={`${inp} resize-none`}
        />
      </div>

      {chipList("links", s.dict.createAgent.linksOptional)}

      <div className="relative flex flex-row gap-2 items-center flex-wrap">
        <button
          onClick={f.build}
          disabled={!f.canSubmit}
          className={`relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm ${
            f.canSubmit ? "" : "opacity-40 text-gray-400"
          }`}
        >
          {s.dict.createAgent.packageContent}
        </button>
        <button onClick={f.reset} className={mini}>
          {s.dict.common.clear}
        </button>
      </div>
    </div>
  );
};

export default CreateAgent;
