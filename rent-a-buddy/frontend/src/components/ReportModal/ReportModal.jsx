import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message, Upload } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { createReport } from '../../service/reportService';
import { toast } from 'sonner';

const { Option } = Select;

const ReportModal = ({ open, onClose, targetId, targetType, targetName, onReported }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setFileList([]);
    }
  }, [open, form]);

  const reasons = {
    Post: ["Nội dung không phù hợp", "Spam", "Thông tin sai lệch", "Ngôn từ thù ghét"],
    Comment: ["Ngôn ngữ xúc phạm", "Spam", "Đe dọa"],
    User: ["Tài khoản giả mạo", "Quấy rối", "Ngôn từ độc hại"]
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('targetId', targetId);
      formData.append('targetType', targetType);
      formData.append('reason', values.reason);
      if (values.details) formData.append('details', values.details);

      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('evidence', file.originFileObj);
        }
      });

      const res = await createReport(formData);

      if (res.success) {
        toast.success(`Đã báo cáo ${targetType} thành công.`);
        if (onReported) onReported();
        onClose();
      } else {
        message.error(res.error || "Gửi báo cáo thất bại.");
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const displayTitle = targetType === 'User' ? targetName : `${targetType} của ${targetName}`;

  return (
    <Modal
      title={`Báo cáo: ${displayTitle}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose} disabled={loading}>Hủy</Button>,
        <Button key="submit" type="primary" danger loading={loading} onClick={form.submit}>Gửi Báo cáo</Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="reason"
          label="Lý do báo cáo"
          rules={[{ required: true, message: 'Vui lòng chọn lý do.' }]}
        >
          <Select placeholder="Chọn lý do chính">
            {reasons[targetType]?.map((reason) => (
              <Option key={reason} value={reason}>{reason}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="details"
          label="Chi tiết (Tùy chọn)"
        >
          <Input.TextArea rows={3} placeholder="Mô tả chi tiết hơn nếu cần..." />
        </Form.Item>

        <Form.Item label="Minh chứng (Ảnh chụp màn hình)">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false}
            maxCount={5}
            accept="image/*"
          >
            {fileList.length < 5 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReportModal;