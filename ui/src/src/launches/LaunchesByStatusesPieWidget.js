import React from 'react';
import SubComponent from '../common/SubComponent'
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import Highcharts from 'highcharts';
import Backend from '../services/backend';

class LaunchesByStatusesPieWidget extends SubComponent {

    state = {
        launches: [],
        filter: {
            skip: 0,
            limit: 20,
            orderby: "id",
            orderdir: "ASC",
            includedFields: "launchStats,createdTime"
        },
        loading: true
    };

    constructor(props) {
        super(props);
        this.getStats = this.getStats.bind(this);
        this.setUpStatusPieSeries = this.setUpStatusPieSeries.bind(this);
        this.statusPieChartRender = this.statusPieChartRender.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.projectId){
            this.state.projectId = nextProps.projectId;
        }
        if (nextProps.filter){
            this.state.filter = nextProps.filter;
        }
        this.getStats();
    }

    componentDidMount() {
        super.componentDidMount();
        this.getStats();
    }

    getStats(){
        if (!this.state.projectId){
            return [];
        }
        Backend.get(this.state.projectId + "/launch/statistics?" + Utils.filterToQuery(this.state.filter))
            .then(response => {
                 this.state.stats = response.data;
                 this.setUpStatusPieSeries();
                 this.state.loading = false;
                 this.setState(this.state);
                 this.statusPieChartRender();
        }).catch(error => {
            Utils.onErrorMessage("Couldn't get launch statistics: ", error);
            this.state.loading = false;
            this.setState(this.state);
        });
    }

    setUpStatusPieSeries(){
        this.state.statusSeries = [{
              name: 'Statuses',
              data: [
                {
                  name: 'Passed',
                  y: this.state.stats.all.launchStats.statusCounters.PASSED,
                  color: '#28a745'
                },
                {
                  name: 'Failed',
                  y: this.state.stats.all.launchStats.statusCounters.FAILED,
                  color: '#dc3545'
                },
                {
                  name: 'Broken',
                  y: this.state.stats.all.launchStats.statusCounters.BROKEN,
                  color: '#ffc107'
                },
                {
                  name: 'Skipped',
                  y: this.state.stats.all.launchStats.statusCounters.SKIPPED,
                  color: '#6c757d'
                },
                {
                  name: 'Runnable',
                  y: this.state.stats.all.launchStats.statusCounters.RUNNABLE,
                  color: '#7cb5ec'
                },
                {
                  name: 'Running',
                  y: this.state.stats.all.launchStats.statusCounters.RUNNING,
                  color: '#007bff'
                }
              ]
            }]

    }

    statusPieChartRender() {
        Highcharts.chart({
            chart: {
              type: 'pie',
              renderTo: 'pie-by-statuses'
            },
            title: {
              verticalAlign: 'middle',
              floating: true,
              text: 'Statuses',
              style: {
                fontSize: '10px',
              }
            },
            plotOptions: {
              pie: {
                dataLabels: {
                    format: '{point.name}: {point.percentage:.1f} %'
                },
                innerSize: '70%'
              }
            },
            series: this.state.statusSeries
        });
    }

    render() {
        return (
            <div>
                <div id="pie-by-statuses"></div>
                <div id='sweet-loading'>
                     <FadeLoader
                       sizeUnit={"px"}
                       size={100}
                       color={'#135f38'}
                       loading={this.state.loading}
                     />
                </div>
            </div>

        );
      }

}

export default LaunchesByStatusesPieWidget;
