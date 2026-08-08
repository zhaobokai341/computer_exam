#!/usr/bin/env python3
"""
合并题目脚本：将非标准格式的 ready_merge.json 合并到标准格式的主文件中。
"""

import json
import sys
import os


def parse_option(opt_str):
    """从 'A 选项内容' 格式中解析出选项字母和内容"""
    opt_str = opt_str.strip()
    if len(opt_str) < 2:
        return None, opt_str
    letter = opt_str[0]
    if letter.isalpha() and opt_str[1] == ' ':
        return letter, opt_str[2:]
    return None, opt_str


def convert_question(q):
    """将非标准格式转换为标准格式"""
    std = {}

    # 题目
    std["question"] = q.get("题目", "")

    # 选项
    raw_options = q.get("选项", [])
    if raw_options:
        options = {}
        for opt in raw_options:
            letter, content = parse_option(opt)
            if letter:
                options[letter] = content
        if options:
            std["options"] = options

    # 正确答案
    std["correct_answer"] = q.get("正确答案", "")

    # 解析（如果有）
    if "解析" in q:
        std["analysis"] = q["解析"]
    elif "analysis" in q:
        std["analysis"] = q["analysis"]

    return std


def merge_questions(main_file, merge_file, output_file=None):
    """合并题目并标记修改之处"""
    # 读取主文件
    with open(main_file, "r", encoding="utf-8") as f:
        main_data = json.load(f)

    # 读取待合并文件
    with open(merge_file, "r", encoding="utf-8") as f:
        merge_data = json.load(f)

    # 记录变更
    changes = {
        "added": [],      # 新增的题目
        "updated": [],    # 更新的题目
        "skipped": [],    # 跳过的题目（无正确答案）
    }

    # 获取主文件中已有的最大 ID
    existing_ids = set(main_data.keys())
    max_id = max((int(k) for k in existing_ids if k.isdigit()), default=0)

    next_id = max_id + 1

    for q in merge_data:
        q_id = str(q.get("ID", ""))
        std_q = convert_question(q)

        # 跳过没有正确答案的题目
        if not std_q.get("correct_answer"):
            changes["skipped"].append(q_id)
            print(f"  [跳过] ID={q_id}：没有正确答案")
            continue

        if q_id in existing_ids:
            # 更新已有题目
            main_data[q_id] = std_q
            changes["updated"].append(q_id)
            print(f"  [更新] ID={q_id}")
        else:
            # 新增题目，分配新 ID
            new_id = str(next_id)
            main_data[new_id] = std_q
            changes["added"].append({"old_id": q_id, "new_id": new_id})
            print(f"  [新增] 原ID={q_id} -> 新ID={new_id}")
            next_id += 1

    # 输出结果
    if output_file is None:
        base, ext = os.path.splitext(main_file)
        output_file = f"{base}_merged{ext}"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(main_data, f, ensure_ascii=False, indent="\t")

    # 打印变更摘要
    print("\n" + "=" * 50)
    print("合并完成！变更摘要：")
    print("=" * 50)
    print(f"  新增题目：{len(changes['added'])} 道")
    for c in changes["added"]:
        print(f"    - 原ID={c['old_id']} -> 新ID={c['new_id']}")
    print(f"  更新题目：{len(changes['updated'])} 道")
    for q_id in changes["updated"]:
        print(f"    - ID={q_id}")
    print(f"  跳过题目：{len(changes['skipped'])} 道（无正确答案）")
    for q_id in changes["skipped"]:
        print(f"    - ID={q_id}")
    print(f"\n输出文件：{output_file}")

    return changes


if __name__ == "__main__":
    main_path = "problems/easy.json"
    merge_path = "problems/easy_ready_merge.json"

    if len(sys.argv) > 1:
        main_path = sys.argv[1]
    if len(sys.argv) > 2:
        merge_path = sys.argv[2]

    merge_questions(main_path, merge_path)