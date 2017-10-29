import React, { Component }                                         from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Platform }       from 'react-native'
import { getMetricMetaInfo, timeToString, getDailyReminderValue }   from '../utils/helpers'
import { clearLocalNotification, setLocalNotification }             from '../utils/helpers'
import UdaciSlider                                                  from './UdaciSlider'
import UdaciSteppers                                                from './UdaciSteppers'
import DateHeader                                                   from './DateHeader'
import { Ionicons }                                                 from '@expo/vector-icons'
import TextButton                                                   from './TextButton'
import {submitEntry, removeEntry}                                   from '../utils/api'
import {connect}                                                    from 'react-redux'
import {addEntry}                                                   from '../actions'
import { purple, white }                                            from '../utils/colors'
import {NavigationActions}                                          from 'react-navigation'

function SubmitBtn({onPress}) {
  return (
    <TouchableOpacity onPress={onPress} style={Platform.OS === 'ios' ? styles.iosSubmitBtn : styles.AndroidSubmitBtn}>
      <Text style={styles.submitBtnText}>Submit</Text>
    </TouchableOpacity>
  )
}


class AddEntry extends Component {

  state = {
    run: 0,
    bike: 0,
    swim: 0,
    sleep: 0,
    eat: 0
  }

  increment = metric=> {
    const { max, step } = getMetricMetaInfo(metric)
    this.setState(current_state=> {
      const count = current_state[metric] + step
      return {
        ...current_state,
        [metric]: count > max ? max : count
      }
    })
  }

  decrement = metric=> {
    this.setState(current_state=> {
      const count = current_state[metric] - getMetricMetaInfo(metric).step
      return {
        ...current_state,
        [metric]: count < 0 ? 0 : count
      }
    })
  }

  slide = (metric, value)=> {
    this.setState({
      [metric]: value
    })
  }

  submit = ()=> {
    const key = timeToString()
    const entry = this.state
    this.setState({run: 0, bike: 0, swim: 0, sleep: 0, eat: 0})
    // Update Redux
    this.props.dispatch(addEntry({
      [key]: entry
    }))
    // Navigate to home
    this.toHome()
    // Save to DB
    submitEntry({key, entry})
    // Clear local notification
    clearLocalNotification()
      .then(setLocalNotification)
  }

  reset = ()=> {
    const key = timeToString()
    // Update Redux
    this.props.dispatch(addEntry({
      [key]: getDailyReminderValue()
    }))
    // Navigate to home
    this.toHome()
    // Save to DB
    removeEntry(key)
  }

  toHome = ()=> {
    this.props.navigation.dispatch(NavigationActions.back({
      key: 'AddEntry'
    }))
  }

  render() {
    const metaInfo = getMetricMetaInfo()

    if (this.props.alreadyLogged) {
      return (
        <View style={styles.center}>
          <Ionicons name={Platform.OS === 'ios' ? 'ios-happy-outline' : 'md-happy'} size={100} />
          <Text>You already logged your information for today</Text>
          <TextButton style={{padding: 10}} onPress={this.reset}>Reset</TextButton>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <DateHeader date={(new Date()).toLocaleDateString()} />
        {Object.keys(metaInfo).map(key=> {
          const { getIcon, type, ...rest} = metaInfo[key]
          const value = this.state[key]
          return (
            <View key={key} style={styles.row}>
              {getIcon()}
              {type === 'slider'
                ? <UdaciSlider value={value} onChange={value=>this.slide(key, value)} {...rest} />
                : <UdaciSteppers value={value} onIncrement={()=> this.increment(key)} onDecrement={()=> this.decrement(key)} {...rest} />
              }
            </View>
          )
        })}
        <SubmitBtn onPress={this.submit} />
      </View>
    )
  }
}

function mapStateToProps(state) {
  const key = timeToString()
  return {
    alreadyLogged: state[key] && typeof state[key].today === 'undefined'
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: white
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  iosSubmitBtn: {
    backgroundColor: purple,
    padding: 10,
    borderRadius: 7,
    height: 45,
    marginLeft: 40,
    marginRight: 40,
  },
  AndroidSubmitBtn: {
    backgroundColor: purple,
    padding: 10,
    paddingLeft: 30,
    paddingRight: 30,
    height: 45,
    borderRadius: 2,
    alignSelf: 'flex-end',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: white,
    fontSize: 22,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 30,
    marginRight: 30,
  },
})

export default connect(mapStateToProps)(AddEntry)
