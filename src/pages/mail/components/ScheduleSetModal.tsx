import React from "react";
import { Modal } from "antd";
import { useControllableValue } from "ahooks";
import ScheduleCron from "@/pages/schedule";

const ScheduleSetModal: React.FC<{ form: any }> = (props) => {
  const { form } = props;
  const [open, setOpen] = useControllableValue<boolean>(props);

  return (
    <Modal
      open={open}
      title="cron规则"
      footer={null}
      onCancel={() => setOpen(false)}
    >
      <ScheduleCron form={form} setOpen={setOpen} />
    </Modal>
  );
};

export default ScheduleSetModal;
