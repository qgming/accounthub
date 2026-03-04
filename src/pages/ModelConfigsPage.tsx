import { Typography } from 'antd'
import ModelConfigList from '../components/modelConfigs/ModelConfigList'

const { Title } = Typography

export default function ModelConfigsPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        模型配置
      </Title>
      <ModelConfigList />
    </div>
  )
}
